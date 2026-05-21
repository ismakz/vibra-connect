import { NextResponse } from "next/server";

import { getLocationTree } from "@/lib/location-queries";

export async function GET() {
  try {
    const countries = await getLocationTree();
    return NextResponse.json({ countries }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { countries: [] as unknown[], error: message },
      { status: 503 },
    );
  }
}
