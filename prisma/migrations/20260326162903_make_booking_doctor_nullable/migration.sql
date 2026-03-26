/*
  Warnings:

  - You are about to drop the `MediaImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MediaImage";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "doctorId" TEXT,
    "dateKey" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "createdBy", "dateKey", "doctorId", "endAt", "endMin", "id", "roomId", "startAt", "startMin", "status", "updatedAt", "updatedBy") SELECT "createdAt", "createdBy", "dateKey", "doctorId", "endAt", "endMin", "id", "roomId", "startAt", "startMin", "status", "updatedAt", "updatedBy" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_dateKey_idx" ON "Booking"("dateKey");
CREATE INDEX "Booking_roomId_dateKey_idx" ON "Booking"("roomId", "dateKey");
CREATE INDEX "Booking_doctorId_dateKey_idx" ON "Booking"("doctorId", "dateKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
