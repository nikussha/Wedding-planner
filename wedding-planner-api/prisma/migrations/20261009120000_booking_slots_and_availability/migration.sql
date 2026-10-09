-- Appointment gains a real time slot (slotStart/slotEnd) in place of the
-- date-only eventDate. SQLite cannot drop/rename columns in place, so the
-- table is rebuilt. Existing rows are carried over and snapped to the 10:00
-- slot of the same planner-local day: DateTime values are stored as epoch
-- milliseconds, so shifting by the +4h planner offset (14400000 ms) gives the
-- local day, and +6h from local midnight is 10:00 local expressed in UTC.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slotStart" DATETIME NOT NULL,
    "slotEnd" DATETIME NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Appointment" ("id", "userId", "slotStart", "slotEnd", "message", "status", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    ((("eventDate" + 14400000) - (("eventDate" + 14400000) % 86400000)) + 21600000),
    ((("eventDate" + 14400000) - (("eventDate" + 14400000) % 86400000)) + 28800000),
    "message",
    "status",
    "createdAt",
    "updatedAt"
FROM "Appointment";

DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";

CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");
CREATE INDEX "Appointment_slotStart_idx" ON "Appointment"("slotStart");
CREATE INDEX "Appointment_status_slotStart_idx" ON "Appointment"("status", "slotStart");

PRAGMA foreign_keys=ON;

-- Admin-editable opening hours (singleton row, id = 'default').
CREATE TABLE "AvailabilitySetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "slotMinutes" INTEGER NOT NULL DEFAULT 120,
    "dayStartHour" INTEGER NOT NULL DEFAULT 10,
    "dayEndHour" INTEGER NOT NULL DEFAULT 18,
    "openWeekdays" TEXT NOT NULL DEFAULT '1,2,3,4,5,6',
    "leadTimeHours" INTEGER NOT NULL DEFAULT 24,
    "horizonDays" INTEGER NOT NULL DEFAULT 365,
    "timezoneOffsetMinutes" INTEGER NOT NULL DEFAULT 240,
    "timezoneLabel" TEXT NOT NULL DEFAULT 'GMT+4',
    "updatedAt" DATETIME NOT NULL
);

-- Individual closed days (holidays, vacation).
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");
