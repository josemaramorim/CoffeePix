-- CreateTable
CREATE TABLE "machine_requests" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "machine_requests" ADD CONSTRAINT "machine_requests_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
