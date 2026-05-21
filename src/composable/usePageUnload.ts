import { onMounted, onUnmounted } from 'vue';

/** 拉取接口数据：usePageUnload */
export const usePageUnload = (callback: () => void) => {
  onMounted((): void => {
    window.addEventListener('beforeunload', callback);
  });
  onUnmounted((): void => {
    window.removeEventListener('beforeunload', callback);
  });
};
