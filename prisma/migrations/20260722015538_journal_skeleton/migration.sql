-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('MEAL', 'MOVIE', 'GAME', 'TRAVEL');

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "experiencedAt" TIMESTAMP(3) NOT NULL,
    "rankPosition" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "winnerEntryId" TEXT NOT NULL,
    "loserEntryId" TEXT NOT NULL,
    "comparedById" TEXT NOT NULL,
    "comparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_domain_label_key" ON "Subcategory"("domain", "label");

-- CreateIndex
CREATE INDEX "Entry_subcategoryId_rankPosition_idx" ON "Entry"("subcategoryId", "rankPosition");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_loserEntryId_fkey" FOREIGN KEY ("loserEntryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_comparedById_fkey" FOREIGN KEY ("comparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
