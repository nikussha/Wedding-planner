-- Public contact-form enquiries, which need no user account.
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "names" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "weddingDate" DATETIME,
    "location" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" DATETIME
);

CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");
