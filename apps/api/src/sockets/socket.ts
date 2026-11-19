import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { redisConnection, isRedisReady } from "../config/redis.js";
import { setOnline, setOffline, refreshPresence } from "../lib/presence.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";

interface SocketUser {
  userId: string;
  systemRole: "admin" | "member";
}

declare module "socket.io" {
  interface Socket {
    user: SocketUser;
  }
}

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin === env.FRONTEND_URL) return callback(null, true);
        if (origin.endsWith(".onrender.com")) return callback(null, true);
        if (origin.startsWith("http://localhost")) return callback(null, true);
        callback(new Error(`Socket CORS: origin ${origin} not allowed`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Tune for scale
    pingTimeout: 20000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // ── Redis adapter: makes pub/sub work across multiple server instances ──
  if (isRedisReady()) {
    try {
      // Create a dedicated pub/sub pair so the main connection isn't blocked
      const pubClient = redisConnection.duplicate();
      const subClient = redisConnection.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket] Redis adapter attached — multi-instance ready");
    } catch (err) {
      console.warn("[Socket] Redis adapter failed — falling back to in-memory:", (err as Error).message);
    }
  } else {
    console.warn("[Socket] Redis not ready — using in-memory adapter (single instance only)");
  }

  // ── JWT auth middleware ─────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized: no token"));
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUser;
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    handleConnection(socket).catch((err) => {
      console.error("[Socket] Connection handler error:", err?.message ?? err);
      socket.disconnect(true);
    });
  });

  return io;
}

async function handleConnection(socket: Socket) {
  const { userId } = socket.user;

  // Join personal + global rooms immediately (no DB needed)
  socket.join(`user:${userId}`);
  socket.join("global:chat");

  // ── Load project memberships from DB (once per connect) ────────────────
  let memberships: { projectId: string }[] = [];
  try {
    memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    memberships.forEach(({ projectId }) => socket.join(`project:${projectId}`));
  } catch (err) {
    console.warn("[Socket] Could not load project memberships:", (err as Error).message);
  }

  // ── Presence: Redis only — zero DB writes on connect ───────────────────
  await setOnline(userId);
  memberships.forEach(({ projectId }) =>
    socket.to(`project:${projectId}`).emit("user_presence", { userId, isOnline: true })
  );

  // Refresh presence TTL on any incoming event (heartbeat)
  socket.onAny(() => {
    refreshPresence(userId).catch(() => {});
  });

  // ── Feature handlers ───────────────────────────────────────────────────
  registerMessageHandlers(io, socket);

  // Typing indicators
  socket.on("typing", ({ projectId }: { projectId: string }) => {
    socket.to(`project:${projectId}`).emit("typing", { userId, projectId });
  });
  socket.on("stop_typing", ({ projectId }: { projectId: string }) => {
    socket.to(`project:${projectId}`).emit("stop_typing", { userId, projectId });
  });

  // ── Disconnect: Redis only — zero DB writes ────────────────────────────
  socket.on("disconnect", async () => {
    await setOffline(userId);
    memberships.forEach(({ projectId }) =>
      io.to(`project:${projectId}`).emit("user_presence", { userId, isOnline: false })
    );
  });
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialised — call initSocket first");
  return io;
}
