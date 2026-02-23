import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status },
  );
}
