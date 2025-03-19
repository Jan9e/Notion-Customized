/*
  Warnings:

  - You are about to drop the column `folderId` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_folderId_fkey";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "folderId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Folder";

-- CreateIndex
CREATE INDEX "Page_workspaceId_parentId_order_idx" ON "Page"("workspaceId", "parentId", "order");

-- CreateIndex
CREATE INDEX "Page_userId_isFavorite_idx" ON "Page"("userId", "isFavorite");
