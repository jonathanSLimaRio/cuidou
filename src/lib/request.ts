import { fail } from "@/lib/http";
import { ZodError, ZodType } from "zod";

export function parsePagination(
  searchParams: URLSearchParams,
  options: { defaultPageSize: number; maxPageSize: number },
) {
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = Number.parseInt(
    searchParams.get("pageSize") ?? String(options.defaultPageSize),
    10,
  );

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, options.maxPageSize)
      : options.defaultPageSize;

  return { page, pageSize };
}

export function parseBoundedInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  try {
    const json = await request.json();
    const data = schema.parse(json);
    return { data } as const;
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        response: fail(422, "Invalid payload", error.flatten()),
      } as const;
    }

    return {
      response: fail(400, "Invalid JSON body"),
    } as const;
  }
}
