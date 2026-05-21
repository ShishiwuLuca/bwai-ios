import { ref, computed, unref } from 'vue';
import type { ComputedRef } from 'vue';
import { useEventListener } from '/@/hooks/event/useEventListener';
import { screenMap, sizeEnum, screenEnum } from '/@/enums/breakpointEnum';

/** globalScreenRef */
let globalScreenRef: ComputedRef<sizeEnum | undefined>;

/** globalWidthRef */
let globalWidthRef: ComputedRef<number>;

/** globalRealWidthRef */
let globalRealWidthRef: ComputedRef<number>;

/** CreateCallbackParams：接口数据结构定义 */
export interface CreateCallbackParams {
  screen: ComputedRef<sizeEnum | undefined>;
  width: ComputedRef<number>;
  realWidth: ComputedRef<number>;
  screenEnum: typeof screenEnum;
  screenMap: Map<sizeEnum, number>;
  sizeEnum: typeof sizeEnum;
}

/** useBreakpoint */
export const useBreakpoint = () => {
  return {
    screenRef: computed(() => unref(globalScreenRef)),
    widthRef: globalWidthRef,
    screenEnum,
    realWidthRef: globalRealWidthRef
  };
};

/** createBreakpointListen */
export const createBreakpointListen = (fn?: (opt: CreateCallbackParams) => void) => {
  const screenRef = ref<sizeEnum>(sizeEnum.XL);
  const realWidthRef = ref(window.innerWidth);

  const getWindowWidth = () => {
    const width = document.body.clientWidth;
    const xs = screenMap.get(sizeEnum.XS)!;
    const sm = screenMap.get(sizeEnum.SM)!;
    const md = screenMap.get(sizeEnum.MD)!;
    const lg = screenMap.get(sizeEnum.LG)!;
    const xl = screenMap.get(sizeEnum.XL)!;
    if (width < xs) {
      screenRef.value = sizeEnum.XS;
    } else if (width < sm) {
      screenRef.value = sizeEnum.SM;
    } else if (width < md) {
      screenRef.value = sizeEnum.MD;
    } else if (width < lg) {
      screenRef.value = sizeEnum.LG;
    } else if (width < xl) {
      screenRef.value = sizeEnum.XL;
    } else {
      screenRef.value = sizeEnum.XXL;
    }
    realWidthRef.value = width;
  };

  useEventListener({
    el: window,
    name: 'resize',
    listener: () => {
      getWindowWidth();
      resizeFn();
    }
    // wait: 100,
  });
  getWindowWidth();
  globalScreenRef = computed(() => unref(screenRef));
  globalWidthRef = computed((): number => screenMap.get(unref(screenRef)!)!);
  globalRealWidthRef = computed((): number => unref(realWidthRef));

  const resizeFn = () => {
    fn?.({
      screen: globalScreenRef,
      width: globalWidthRef,
      realWidth: globalRealWidthRef,
      screenEnum,
      screenMap,
      sizeEnum
    });
  };

  resizeFn();
  return {
    screenRef: globalScreenRef,
    screenEnum,
    widthRef: globalWidthRef,
    realWidthRef: globalRealWidthRef
  };
};
