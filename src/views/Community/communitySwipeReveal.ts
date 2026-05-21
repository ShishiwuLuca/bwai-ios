import { nextTick } from 'vue';

/** runAfterDoubleRaf */
export const runAfterDoubleRaf = (callback: () => void): void => {
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  });
};
