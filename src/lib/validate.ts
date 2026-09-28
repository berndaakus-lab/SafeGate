import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export type FieldErrors = Record<string, string>;

export function fieldErrorResponse(fields: FieldErrors, status = 400) {
  return NextResponse.json({ error: Object.values(fields)[0] ?? "Invalid request", fields }, { status });
}

/** Parses and validates a JSON request body against a Zod schema.
 * Returns `{ data }` on success or `{ error }` (a ready-to-return NextResponse) on failure.
 * The error body carries `fields` (dot-path → message) so forms can show each message under its input. */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const fields: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    return { error: fieldErrorResponse(fields) };
  }

  return { data: result.data };
}
