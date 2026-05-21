-- Territoire / zone rurale entre Province et Ville (compatibilité provinceId conservée sur City).

CREATE TABLE "Territory" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Territory_provinceId_slug_key" ON "Territory"("provinceId", "slug");
CREATE INDEX "Territory_provinceId_idx" ON "Territory"("provinceId");

ALTER TABLE "Territory" ADD CONSTRAINT "Territory_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "City" ADD COLUMN "territoryId" TEXT;

CREATE INDEX "City_territoryId_idx" ON "City"("territoryId");

ALTER TABLE "City" ADD CONSTRAINT "City_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
