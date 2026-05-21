import { ref, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';
import { getNavigatorNetworkTypeLabel } from '/@/utils/networkType';

/** useNetworkType */
export const useNetworkType = () => {
  const networkType = ref<any>('');
  const connection = (navigator as any).connection;
  const getNetworkType = (): string => getNavigatorNetworkTypeLabel();
  const update = () => {
    networkType.value = getNetworkType();
  };
  const start = () => {
    update();
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', update);
    }
  };
  const stop = () => {
    if (connection && connection.removeEventListener) {
      connection.removeEventListener('change', update);
    }
  };
  // ✅ 只有在组件环境中才注册生命周期钩子
  if (getCurrentInstance()) {
    onMounted(start);
    onBeforeUnmount(stop);
  } else {
    // ✅ 非组件环境中，立即启动
    start();
  }
  return {
    networkType: networkType.value,
    stop // 可用于手动解绑监听
  };
};
