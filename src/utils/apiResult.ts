/** isApiSuccess */
export const isApiSuccess = (
  res:
    | {
        code?: number;
        data?: unknown;
      }
    | null
    | undefined
): boolean => {
  return res != null && res.code === 0 && res.data != null;
};
