import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

/** useSafariViewport */
export const useSafariViewport = () => {
  const viewportHeight = ref<number>(window.visualViewport?.height || window.innerHeight);
  const innerHeight = ref<number>(window.innerHeight);
  const lastVisualHeight = ref<number>(viewportHeight.value);
  const lastInnerHeight = ref<number>(innerHeight.value);
  const collapsedThreshold = 80; // 你可以根据实际测试调整这个值
  // 判断是否地址栏收缩：viewportHeight 和 innerHeight 差距变小意味着收缩了
  const isAddressBarCollapsed = computed(() => {
    const gap = innerHeight.value - viewportHeight.value;
    return gap < collapsedThreshold;
  });
  const detectChange = (): void => {
    const vv = window.visualViewport;
    const currentVVHeight = vv?.height || 0;
    const currentInnerHeight = window.innerHeight;
    // 变化超过一定值才更新，避免过多响应
    if (Math.abs(currentVVHeight - lastVisualHeight.value) > 5) {
      lastVisualHeight.value = currentVVHeight;
      viewportHeight.value = currentVVHeight;
    }
    if (Math.abs(currentInnerHeight - lastInnerHeight.value) > 5) {
      lastInnerHeight.value = currentInnerHeight;
      innerHeight.value = currentInnerHeight;
    }
  };
  onMounted((): void => {
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectChange);
    }
    window.addEventListener('resize', detectChange);
    window.addEventListener('scroll', detectChange);
  });
  onBeforeUnmount((): void => {
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', detectChange);
    }
    window.removeEventListener('resize', detectChange);
    window.removeEventListener('scroll', detectChange);
  });
  return {
    viewportHeight,
    innerHeight,
    isAddressBarCollapsed
  };
};
