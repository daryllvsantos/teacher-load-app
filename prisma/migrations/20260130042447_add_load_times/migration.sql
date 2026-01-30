/*
  Warnings:

  - You are about to drop the column `hours` on the `Load` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `Load` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Load` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Load" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Load_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Load_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Load" ("createdAt", "id", "shift", "subjectId", "teacherId", "updatedAt", "startTime", "endTime")
SELECT "createdAt", "id", "shift", "subjectId", "teacherId", "updatedAt", '06:00', '07:10' FROM "Load";
DROP TABLE "Load";
ALTER TABLE "new_Load" RENAME TO "Load";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
