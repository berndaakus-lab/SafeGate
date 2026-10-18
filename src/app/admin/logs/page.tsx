import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseLogQuery, queryPickupLogs } from "@/lib/pickup-logs";
import LogsClient from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function LogsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId as string;
  const schoolName = ((session?.user as any)?.schoolName as string) ?? "School";

  const params = await searchParams;
  const query = parseLogQuery((k) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  });
  const result = await queryPickupLogs(schoolId, query);

  return (
    <LogsClient
      rows={result.rows}
      total={result.total}
      query={query}
      schoolName={schoolName}
      error={result.error ?? null}
    />
  );
}
