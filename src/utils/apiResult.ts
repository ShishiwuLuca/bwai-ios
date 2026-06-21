/** isApiSuccess */
export const isApiSuccess = (
  res:
    | {
        code?: number;
        msg?: string;
        data?: unknown;
      }
    | null
    | undefined
): boolean => {
  return res != null && res.code === 0 && res.data != null;
};
