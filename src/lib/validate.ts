import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/** Parses and validates a JSON request body against a Zod schema.
 * Returns `{ data }` on success or `{ error }` (a ready-to-return NextResponse) on failure. */
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
    const message = result.error.issues[0]?.message ?? "Invalid request";
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }

  return { data: result.data };
}
