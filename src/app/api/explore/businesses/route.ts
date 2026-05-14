import { NextResponse } from "next/server";

import {
  type MarketplacePlanFilter,
  type MarketplaceSort,
  getMarketplaceBusinessesPage,
} from "@/lib/marketplace-queries";
import { getPlatformSettings } from "@/lib/platform-settings";

function parsePlan(v: string | null): MarketplacePlanFilter {
  const x = (v ?? "all").toLowerCase();
  if (x === "free" || x === "standard" || x === "premium" || x === "sponsored") return x;
  return "all";
}

function parseSort(v: string | null): MarketplaceSort {
  const x = (v ?? "recent").toLowerCase();
  if (x === "popular" || x === "views" || x === "premium") return x;
  return "recent";
}

export async function GET(req: Request) {
  const settings = await getPlatformSettings();
  if (settings.maintenanceMode) {
    return NextResponse.json(
      { ok: false as const, error: "Marketplace en maintenance temporaire (configuration CEO)." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const result = await getMarketplaceBusinessesPage({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    plan: parsePlan(searchParams.get("plan")),
    sponsoredOnly: searchParams.get("sponsored") === "1",
    sort: parseSort(searchParams.get("sort")),
    page,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false as const, error: result.error }, { status: 503 });
  }

  return NextResponse.json({
    ok: true as const,
    rows: result.rows,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
