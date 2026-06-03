/*
  Warnings:

  - Added the required column `applicantName` to the `PipelineCase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planName` to the `PipelineCase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PipelineCase" DROP CONSTRAINT "PipelineCase_policyId_fkey";

-- AlterTable
ALTER TABLE "PipelineCase" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "applicantName" TEXT NOT NULL,
ADD COLUMN     "planName" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "policyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PipelineCase" ADD CONSTRAINT "PipelineCase_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineCase" ADD CONSTRAINT "PipelineCase_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
