-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "aiDetails" JSONB,
ALTER COLUMN "severity" DROP NOT NULL,
ALTER COLUMN "severity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contractorId" TEXT;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "completionNotes" TEXT,
ADD COLUMN     "proofImageUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "performedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
