-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_teacherId_fkey";

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "career" TEXT,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
