import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { redisConnection, isRedisReady } from "../config/redis.js";

interface JwtPayload {
  userId: string;
  systemRole: "admin" | "member";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const ACTIVE_CACHE_TTL_SEC = 30;

export async function invalidateActiveUserCache(userId: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redisConnection.del(`user:active:${userId}`);
  } catch {
    // Non-fatal
  }
}

async function isUserActive(userId: string): Promise<{ isActive: boolean; systemRole?: "admin" | "member" }> {
  const cacheKey = `user:active:${userId}`;

  if (isRedisReady()) {
    try {
      const cached = await redisConnection.get(cacheKey);
      if (cached !== null) {
        return JSON.parse(cached) as { isActive: boolean; systemRole?: "admin" | "member" };
      }
    } catch {
      // Fall through to DB
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, systemRole: true },
  });

  const status = {
    isActive: Boolean(user?.isActive),
    systemRole: user?.systemRole,
  };

  if (isRedisReady()) {
    try {
      await redisConnection.set(cacheKey, JSON.stringify(status), "EX", ACTIVE_CACHE_TTL_SEC);
    } catch {
      // Non-fatal
    }
  }

  return status;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.slice(7).trim();

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  try {
    const status = await isUserActive(decoded.userId);
    if (!status.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact your admin.",
      });
    }

    req.user = {
      userId: decoded.userId,
      systemRole: status.systemRole ?? decoded.systemRole,
    };

    return next();
  } catch {
    return res.status(503).json({
      success: false,
      message: "Authentication check temporarily unavailable",
    });
  }
}
