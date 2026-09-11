import { getAppBaseUrl } from "@/lib/utils/url";

const DEFAULT_POST_LOGIN_REDIRECT_PATH = "/app/overview";

function normalizeRelativePath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(value, getAppBaseUrl());
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function normalizeRedirectPath(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input) {
    return null;
  }

  const relativePath = normalizeRelativePath(input);
  if (relativePath) {
    return relativePath;
  }

  try {
    const parsed = new URL(input);
    return normalizeRelativePath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return null;
  }
}

export function getPostLoginRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_REDIRECT_PATH,
): string {
  return normalizeRedirectPath(value) ?? fallback;
}

export function withRedirectUrl(
  path: string,
  redirectPath: string | null | undefined,
): string {
  const normalizedRedirectPath = normalizeRedirectPath(redirectPath);
  if (!normalizedRedirectPath) {
    return path;
  }

  const url = new URL(path, getAppBaseUrl());
  url.searchParams.set("redirect_url", normalizedRedirectPath);
  return `${url.pathname}${url.search}${url.hash}`;
}
