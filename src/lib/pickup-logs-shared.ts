// Safe to import from client components: nothing here touches the database

export type LogRow = {
  id: string;
  picked_up_at: string;
  studentName: string;
  className: string;
  collectedBy: string;
  relation: string;
  vehicleNumber: string;
  parentName: string;
  releasedBy: string | null;
  releasedByRole: string | null;
  method: string;
};

export type LogQuery = { q: string; from: string; to: string; page: number; pageSize: number };

export const PAGE_SIZES = [25, 50, 100] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads and cleans paging, search and date filters from URL parameters. */
export function parseLogQuery(get: (key: string) => string | null | undefined, maxPageSize = 100): LogQuery {
  const size = Number(get("size"));
  const page = Math.floor(Number(get("page")));
  const from = get("from") ?? "";
  const to = get("to") ?? "";
  return {
    q: (get("q") ?? "").trim().slice(0, 100),
    from: DATE.test(from) ? from : "",
    to: DATE.test(to) ? to : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(size) && size > 0 ? Math.min(Math.floor(size), maxPageSize) : 25,
  };
}
