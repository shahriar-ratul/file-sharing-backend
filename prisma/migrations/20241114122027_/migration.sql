/*
  Warnings:

  - Added the required column `fileType` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "fileType" TEXT NOT NULL;