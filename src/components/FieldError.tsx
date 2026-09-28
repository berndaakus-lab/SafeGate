export type FieldErrors = Record<string, string>;

export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

/** Reads an API error body. `fields` maps input names to messages; `message` is
 * only meant for a form-level banner when no individual field is to blame. */
export async function readApiErrors(res: Response, fallback: string): Promise<{ message: string; fields: FieldErrors }> {
  const data = await res.json().catch(() => ({}));
  const fields: FieldErrors = data?.fields ?? {};
  return { message: Object.keys(fields).length ? "" : data?.error || fallback, fields };
}

export function withErrorRing(base: string, hasError: boolean) {
  return hasError ? `${base} border-red-300 focus:ring-red-400 bg-red-50/40` : base;
}
