import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseLogQuery, queryPickupLogs } from "@/lib/pickup-logs";

// School admin: a page of pickup logs. The Logs screen uses it to fetch every
// page when exporting all matching records.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if ((session?.user as any)?.role !== "admin" || !schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = parseLogQuery((k) => req.nextUrl.searchParams.get(k), 500);
  const result = await queryPickupLogs(schoolId, query);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ rows: result.rows, total: result.total, page: query.page, pageSize: query.pageSize });
}
