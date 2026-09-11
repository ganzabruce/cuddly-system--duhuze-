export class DbDependencyError extends Error {
  constructor(
    message = "Database dependency unavailable",
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "DbDependencyError";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function isDbDependencyError(error: unknown): error is DbDependencyError {
  return error instanceof DbDependencyError;
}
