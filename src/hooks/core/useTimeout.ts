import { ref, watch } from 'vue';
import { tryOnUnmounted } from '@vueuse/core';
import { isFunction } from '/@/utils/is';

/** useTimeoutFn */
export const useTimeoutFn = (handle: Fn<any>, wait: number, native = false) => {
  if (!isFunction(handle)) {
    throw new Error('handle is not Function!');
  }
  const { readyRef, stop, start } = useTimeoutRef(wait);
  if (native) {
    handle();
  } else {
    watch(
      readyRef,
      (maturity: boolean) => {
        if (maturity) {
          handle();
        }
      },
      { immediate: false }
    );
  }
  return { readyRef, stop, start };
};

/** useTimeoutRef */
export const useTimeoutRef = (wait: number) => {
  const readyRef = ref(false);
  let timer: TimeoutHandle;

  const stop = (): void => {
    readyRef.value = false;
    if (timer) {
      window.clearTimeout(timer);
    }
  };

  const start = (): void => {
    stop();
    timer = setTimeout(() => {
      readyRef.value = true;
    }, wait);
  };

  start();
  tryOnUnmounted(stop);
  return { readyRef, stop, start };
};
