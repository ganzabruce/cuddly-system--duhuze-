/** Result state for a public marketing form submission (contact, support). */
export type FormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};
