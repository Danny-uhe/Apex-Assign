-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "repeat" TEXT NOT NULL DEFAULT 'none',
    "dueDate" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTask_pkey" PRIMARY KEY ("id")
);

-- Ensure repeat column exists if table was previously synced via db push
ALTER TABLE "PersonalTask" ADD COLUMN IF NOT EXISTS "repeat" TEXT NOT NULL DEFAULT 'none';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PersonalTask_userId_idx" ON "PersonalTask"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PersonalTask_userId_dueDate_idx" ON "PersonalTask"("userId", "dueDate");

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PersonalTask_userId_fkey'
    ) THEN
        ALTER TABLE "PersonalTask" ADD CONSTRAINT "PersonalTask_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
