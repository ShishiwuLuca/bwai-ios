import { toggleClass } from './util';

/** updateGrayMode */
export const updateGrayMode = (gray: boolean) => {
  toggleClass(gray, 'gray-mode', document.documentElement);
};
