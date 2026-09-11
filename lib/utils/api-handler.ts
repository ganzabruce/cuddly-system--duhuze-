import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/utils/errors";
import logger from "@/lib/utils/logger";

type ApiHandler<C = unknown> = (request: Request, context: C) => Promise<NextResponse>;

export function withApiHandler<C = unknown>(label: string, handler: ApiHandler<C>): ApiHandler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation failed: ${label}`, { issues: error.issues });
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }

      if (error instanceof AppError) {
        logger.warn(`Handled application error: ${label}`, {
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
        });
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode },
        );
      }

      logger.error(`Unhandled error: ${label}`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  return { page, limit };
}
