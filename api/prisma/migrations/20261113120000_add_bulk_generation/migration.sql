CREATE TYPE "BulkJobStatus" AS ENUM ('pending', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled');
CREATE TYPE "BulkJobRowStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE "BulkJob" (
  "id" TEXT NOT NULL,
  "status" "BulkJobStatus" NOT NULL DEFAULT 'pending',
  "originalFileName" TEXT NOT NULL,
  "originalFormat" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "sheetName" TEXT,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "processedRows" INTEGER NOT NULL DEFAULT 0,
  "successfulRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "settings" JSONB NOT NULL,
  "mapping" JSONB NOT NULL,
  "columns" JSONB NOT NULL,
  "sheetNames" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "BulkJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BulkJobRow" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "inputData" JSONB NOT NULL,
  "outputData" JSONB,
  "status" "BulkJobRowStatus" NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BulkJobRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BulkJob_status_createdAt_idx" ON "BulkJob"("status", "createdAt");
CREATE INDEX "BulkJobRow_jobId_status_rowIndex_idx" ON "BulkJobRow"("jobId", "status", "rowIndex");
CREATE UNIQUE INDEX "BulkJobRow_jobId_rowIndex_key" ON "BulkJobRow"("jobId", "rowIndex");
ALTER TABLE "BulkJobRow" ADD CONSTRAINT "BulkJobRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BulkJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
