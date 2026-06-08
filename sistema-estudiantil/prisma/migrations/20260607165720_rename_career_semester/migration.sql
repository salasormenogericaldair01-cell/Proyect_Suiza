/*
  Warnings:

  - You are about to drop the column `grade` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `students` table. All the data in the column will be lost.
  - Added the required column `career` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "grade",
DROP COLUMN "section",
ADD COLUMN     "career" TEXT NOT NULL,
ADD COLUMN     "semester" TEXT NOT NULL;
