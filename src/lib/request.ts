import { fail } from "@/lib/http";
import { ZodError, ZodType } from "zod";

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
