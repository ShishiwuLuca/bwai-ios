import { toggleClass } from './util';

/** updateColorWeak */
export const updateColorWeak = (colorWeak: boolean) => {
  toggleClass(colorWeak, 'color-weak', document.documentElement);
};
