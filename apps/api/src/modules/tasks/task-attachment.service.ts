import path from "node:path";
import { prisma } from "../../config/prisma.js";
import { uploadDirectory } from "../../middleware/upload.middleware.js";

export async function addTaskAttachments(
  taskId: string,
  userId: string,
  files: Express.Multer.File[]
) {
  if (!files.length) {
    throw new Error("No files were uploaded");
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: task.projectId,
      },
    },
  });

  if (!member) {
    throw new Error("You are not a member of this project");
  }

  return prisma.taskAttachment.createManyAndReturn({
    data: files.map((file) => ({
      taskId,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileUrl: `/uploads/tasks/${file.filename}`,
    })),
  });
}


export async function getTaskAttachments(
  taskId: string,
  userId: string
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: task.projectId,
      },
    },
  });

  if (!member) {
    throw new Error("You are not a member of this project");
  }

  return prisma.taskAttachment.findMany({
    where: {
      taskId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAuthorizedAttachmentPath(
  fileName: string,
  userId: string
): Promise<string> {
  const safeName = path.basename(fileName);
  if (!safeName || safeName !== fileName) {
    throw new Error("Invalid file name");
  }

  const attachment = await prisma.taskAttachment.findFirst({
    where: { fileName: safeName },
    select: {
      fileName: true,
      task: { select: { projectId: true } },
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId: attachment.task.projectId,
      },
    },
  });

  if (!member) {
    throw new Error("You are not a member of this project");
  }

  return path.join(uploadDirectory, safeName);
}