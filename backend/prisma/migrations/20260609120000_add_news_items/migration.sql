-- CreateTable
CREATE TABLE "news_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "reasonRecommended" TEXT NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT true,
    "titleFingerprint" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_items_url_key" ON "news_items"("url");

-- CreateIndex
CREATE INDEX "news_items_recommended_relevanceScore_publishedDate_idx" ON "news_items"("recommended", "relevanceScore", "publishedDate");

-- CreateIndex
CREATE INDEX "news_items_titleFingerprint_idx" ON "news_items"("titleFingerprint");
