import { prisma } from "../../config/prisma.js";
import { createInvitation } from "../invitaions/invitation.service.js";
import { invalidateActiveUserCache } from "../../middleware/auth.middleware.js";

/**
 * Total users count, total projects count, total tasks count, total tasks done,
 * and completion rate percentage (scoped to requester's organization).
 */
export async function getOrganisationStats(requesterId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: requesterId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const [totalUsers, totalProjects, totalTasks, totalTasksDone] = await Promise.all([
    prisma.user.count({
      where: orgIds.length
        ? { organizationMembers: { some: { organizationId: { in: orgIds } } } }
        : undefined,
    }),
    prisma.project.count({
      where: orgIds.length ? { organizationId: { in: orgIds } } : undefined,
    }),
    prisma.task.count({
      where: orgIds.length
        ? { project: { organizationId: { in: orgIds } } }
        : undefined,
    }),
    prisma.task.count({
      where: orgIds.length
        ? { status: "done", project: { organizationId: { in: orgIds } } }
        : { status: "done" },
    }),
  ]);

  const completionRate =
    totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0;

  return {
    totalUsers,
    totalProjects,
    totalTasks,
    completedTasks: totalTasksDone,
    completionRate,
  };
}

/**
 * List all users with their project count, tasks count, and points.
 */
export async function getOrgMembers(requesterId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: requesterId },
    select: { organizationId: true },
  });
  const organizationIds = memberships.map(({ organizationId }) => organizationId);

  if (organizationIds.length === 0) {
    throw new Error("You must belong to an organization to view its members.");
  }

  const users = await prisma.user.findMany({
    where: {
      organizationMembers: {
        some: { organizationId: { in: organizationIds } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      systemRole: true,
      isActive: true,
      avatar: true,
      bio: true,
      position: true,
      isOnline: true,
      points: true,
      streak: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          assignedTasks: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const doneGroups = await prisma.task.groupBy({
    by: ["assignedToId"],
    where: {
      assignedToId: { in: users.map((u) => u.id) },
      status: "done",
      isArchived: false,
    },
    _count: { _all: true },
  });
  const doneMap = new Map<string, number>(
    doneGroups
      .filter((g) => g.assignedToId !== null)
      .map((g) => [g.assignedToId as string, g._count._all])
  );

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.systemRole,
    systemRole: u.systemRole,
    isActive: u.isActive,
    avatar: u.avatar,
    bio: u.bio,
    position: u.position,
    isOnline: u.isOnline,
    points: u.points,
    streak: u.streak,
    projectCount: u._count.projects,
    taskCount: u._count.assignedTasks,
    tasksCompleted: doneMap.get(u.id) ?? 0,
    createdAt: u.createdAt,
  }));
}

/**
 * Creates an Invitation record and returns it.
 */
export async function inviteMember(
  email: string,
  invitedById: string,
  name?: string,
  systemRole: "admin" | "member" = "member"
) {
  const normalizedEmail = email.trim().toLowerCase();
  const inviteeName = name?.trim() || normalizedEmail.split("@")[0];

  return createInvitation(
    invitedById,
    normalizedEmail,
    inviteeName,
    systemRole
  );
}

/**
 * Deactivates user (set isActive: false).
 */
export async function removeUser(userId: string, callerId?: string) {
  if (callerId && callerId === userId) {
    throw new Error("You cannot remove your own account.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found.");

  if (target.systemRole === "admin") {
    const activeAdminCount = await prisma.user.count({
      where: { systemRole: "admin", isActive: true },
    });
    if (activeAdminCount <= 1) {
      throw new Error("Cannot deactivate the last admin. Promote another user first.");
    }
  }

  await prisma.refreshToken.deleteMany({ where: { userId } });
  await invalidateActiveUserCache(userId);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: { id: true, name: true, email: true, systemRole: true, isActive: true },
  });
}

/**
 * Re-activates a previously deactivated user.
 */
export async function activateUser(userId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found.");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: { id: true, name: true, email: true, systemRole: true, isActive: true },
  });
  await invalidateActiveUserCache(userId);
  return updated;
}

/**
 * Change a user's systemRole (admin ↔ member).
 */
export async function changeUserRole(
  userId: string,
  systemRole: "admin" | "member",
  callerId?: string
) {
  if (callerId && callerId === userId) {
    throw new Error("You cannot change your own role.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found.");

  // Prevent demoting the last admin
  if (target.systemRole === "admin" && systemRole === "member") {
    const adminCount = await prisma.user.count({
      where: { systemRole: "admin", isActive: true },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot demote the last admin. Promote another user first.");
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { systemRole },
    select: { id: true, name: true, email: true, systemRole: true, isActive: true },
  });
}
