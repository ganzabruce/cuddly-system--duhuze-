export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type DeleteResult<T = number> = {
  success: boolean;
  id: T;
};
