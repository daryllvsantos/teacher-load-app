/*
  Warnings:

  - Added the required column `classId` to the `Load` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeLevel" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "adviser" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Load" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT,
    "shift" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Load_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Load_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Load_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Load" ("createdAt", "endTime", "id", "shift", "startTime", "subjectId", "teacherId", "updatedAt") SELECT "createdAt", "endTime", "id", "shift", "startTime", "subjectId", "teacherId", "updatedAt" FROM "Load";
DROP TABLE "Load";
ALTER TABLE "new_Load" RENAME TO "Load";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
