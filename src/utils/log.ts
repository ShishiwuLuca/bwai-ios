/** projectName */
const projectName = import.meta.env.VITE_GLOB_APP_TITLE;

/** warn */
export const warn = (message: string) => {
  console.warn(`[${projectName} warn]:${message}`);
};

/** error */
export const error = (message: string) => {
  throw new Error(`[${projectName} error]:${message}`);
};
