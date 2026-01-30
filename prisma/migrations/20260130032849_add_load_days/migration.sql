-- CreateTable
CREATE TABLE "LoadDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loadId" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    CONSTRAINT "LoadDay_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LoadDay_loadId_weekday_key" ON "LoadDay"("loadId", "weekday");
