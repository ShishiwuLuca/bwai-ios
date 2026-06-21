import type { Ref } from 'vue';
import echarts from '/@/utils/lib/echarts';
import type { EChartsOption } from 'echarts';
import { useTimeoutFn } from '/@/hooks/core/useTimeout';
import { unref, nextTick, watch, computed, ref } from 'vue';
import { useDebounceFn, tryOnUnmounted } from '@vueuse/core';
import { useBreakpoint } from '/@/hooks/event/useBreakpoint';
import { useEventListener } from '/@/hooks/event/useEventListener';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** useECharts */
export const useECharts = (
  elRef: Ref<HTMLDivElement>,
  theme: 'light' | 'dark' | 'default' = 'default'
) => {
  const systemStore = useSystemStoreWithOut();
  const getSysDarkMode = computed(() => {
    return systemStore.getDarkMode;
  });
  const getDarkMode = computed(() => {
    return theme === 'default' ? getSysDarkMode.value : theme;
  });
  let chartInstance: echarts.ECharts | null = null;
  const cacheOptions = ref({}) as Ref<EChartsOption>;
  let removeResizeFn: Fn = () => {};

  const resize = () => {
    chartInstance?.resize();
  };

  const resizeFn = useDebounceFn(resize, 200);

  const getOptions = computed(() => {
    if (getDarkMode.value !== 'dark') {
      return cacheOptions.value as EChartsOption;
    }
    return {
      backgroundColor: 'transparent',
      ...cacheOptions.value
    } as EChartsOption;
  });

  const initCharts = (t = theme) => {
    const el = unref(elRef);
    if (!el || !unref(el)) {
      return;
    }
    chartInstance = echarts.init(el, t);
    const { removeEvent } = useEventListener({
      el: window,
      name: 'resize',
      listener: resizeFn
    });
    removeResizeFn = removeEvent;
    const { widthRef, screenEnum } = useBreakpoint();
    if (unref(widthRef) <= screenEnum.MD || el.offsetHeight === 0) {
      useTimeoutFn(() => {
        resizeFn();
      }, 30);
    }
  };

  const setOptions = (options: EChartsOption, clear = true) => {
    cacheOptions.value = options;
    if (unref(elRef)?.offsetHeight === 0) {
      useTimeoutFn(() => {
        setOptions(unref(getOptions));
      }, 30);
      return;
    }
    nextTick(() => {
      useTimeoutFn(() => {
        if (!chartInstance) {
          initCharts(getDarkMode.value as 'default');
          if (!chartInstance) return;
        }
        if (clear) {
          chartInstance?.clear();
        }
        chartInstance?.setOption(unref(getOptions));
      }, 30);
    });
  };

  watch(
    () => getDarkMode.value,
    (theme) => {
      if (chartInstance) {
        chartInstance.dispose();
        initCharts(theme as 'default');
        setOptions(cacheOptions.value);
      }
    }
  );

  tryOnUnmounted(() => {
    if (!chartInstance) return;
    removeResizeFn();
    chartInstance.dispose();
    chartInstance = null;
  });

  const getInstance = (): echarts.ECharts | null => {
    if (!chartInstance) {
      initCharts(getDarkMode.value as 'default');
    }
    return chartInstance;
  };

  const dispatchAction = (data: any) => {
    nextTick(() => {
      useTimeoutFn(() => {
        chartInstance?.dispatchAction(data);
      }, 30);
    });
  };

  return {
    setOptions,
    resize,
    echarts,
    getInstance,
    dispatchAction
  };
};
