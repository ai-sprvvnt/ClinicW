-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClinicSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "clinicName" TEXT,
    "logoUrl" TEXT,
    "themePalette" TEXT NOT NULL DEFAULT 'clinic',
    "maxRooms" INTEGER,
    "maxDoctors" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ClinicSettings" ("clinicName", "createdAt", "id", "logoUrl", "maxDoctors", "maxRooms", "updatedAt") SELECT "clinicName", "createdAt", "id", "logoUrl", "maxDoctors", "maxRooms", "updatedAt" FROM "ClinicSettings";
DROP TABLE "ClinicSettings";
ALTER TABLE "new_ClinicSettings" RENAME TO "ClinicSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
