-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeLevel" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "adviser" TEXT NOT NULL,
    "shift" TEXT NOT NULL DEFAULT 'MORNING',
    "color" TEXT NOT NULL DEFAULT '#1d4ed8',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Class" ("adviser", "color", "createdAt", "gradeLevel", "id", "section", "updatedAt") SELECT "adviser", "color", "createdAt", "gradeLevel", "id", "section", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
