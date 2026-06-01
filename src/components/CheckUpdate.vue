<script setup lang="ts">
  // Vant 弹窗
  import { Dialog } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getAppEnvConfig } from '/@/utils/env';
  import { onMounted, onUnmounted, ref } from 'vue';

  defineOptions({ name: 'CheckUpdates' });

  // 环境配置中的系统版本号

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { VITE_GLOB_SYSTEM_VERSION } = getAppEnvConfig();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** Props：接口数据结构定义 */
  interface Props {
    /** 轮询检查间隔，单位：分钟 */
    checkUpdatesInterval?: number;
    /** 检查更新时请求的地址（用于获取 etag/last-modified） */
    checkUpdateUrl?: string;
  }

  /** props */
  const props = withDefaults(defineProps<Props>(), {
    checkUpdatesInterval: 1,
    checkUpdateUrl: import.meta.env.BASE_URL || '/'
  });

  // 是否正在执行检查更新，避免重复请求

  /** isCheckingUpdates */
  let isCheckingUpdates = false;

  // 当前版本

  /** 响应式状态：事件或回调处理 */
  const currentVersionTag = ref<string>('');

  // 上次版本

  /** 响应式状态：事件或回调处理 */
  const lastVersionTag = ref<string>('');

  // 弹窗显示状态

  /** 响应式状态：显隐控制 */
  const isShowModal = ref<boolean>(false);

  // 定时器

  /** 响应式状态：timer 相关 UI 或数据 */
  const timer = ref<ReturnType<typeof setInterval>>();

  // 用户确认更新：记录当前版本并刷新页面

  /** 事件或回调处理：onConfirm */
  const onConfirm = (): void => {
    lastVersionTag.value = currentVersionTag.value;
    window.location.reload();
  };

  // 请求检查地址，返回 etag 或 last-modified 作为版本标识

  /** 事件或回调处理（getVersionTag） */
  const getVersionTag = async () => {
    try {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return null;
      }
      const response = await fetch(props.checkUpdateUrl, {
        cache: 'no-cache',
        method: 'HEAD'
      });
      return response.headers.get('etag') || response.headers.get('last-modified');
    } catch {
      console.error('Failed to fetch version tag');
      return null;
    }
  };

  // 拉取版本标识并对比，若有更新则弹窗提示

  /** 方法：checkForUpdates */
  const checkForUpdates = async () => {
    const versionTag = await getVersionTag();
    if (!versionTag) {
      return;
    }

    // 首次运行时不提示更新
    if (!lastVersionTag.value) {
      lastVersionTag.value = versionTag;
      return;
    }

    if (lastVersionTag.value !== versionTag && versionTag) {
      clearInterval(timer.value);
      handleNotice(versionTag);
    }
  };

  // 显示更新提示弹窗

  /** handleNotice */
  const handleNotice = (versionTag: string) => {
    currentVersionTag.value = versionTag;
    isShowModal.value = true;
  };

  // 启动定时轮询检查更新

  /** start */
  const start = () => {
    if (props.checkUpdatesInterval <= 0) {
      return;
    }

    // 每 checkUpdatesInterval(默认值为1) 分钟检查一次
    timer.value = setInterval(checkForUpdates, props.checkUpdatesInterval * 60 * 1000);
  };

  // 页面从隐藏变为可见时触发一次检查，再恢复定时器

  /** handleVisibilitychange */
  const handleVisibilitychange = (): void => {
    if (document.hidden) {
      stop();
    } else {
      if (!isCheckingUpdates) {
        isCheckingUpdates = true;
        checkForUpdates().finally(() => {
          isCheckingUpdates = false;
          start();
        });
      }
    }
  };

  // 停止定时器

  /** stop */
  const stop = (): void => {
    clearInterval(timer.value);
  };

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    start();
    document.addEventListener('visibilitychange', handleVisibilitychange);
  });

  /** 组件卸载时清理副作用 */
  onUnmounted(() => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibilitychange);
  });
</script>
<template>
  <Dialog
    v-model:show="isShowModal"
    theme="round-button"
    :title="t('common_title_text')"
    @confirm="onConfirm"
    width="90%"
  >
    <div class="p-2 mode_color">
      {{ t('system_update_message')
      }}<span class="!text-[red]">V{{ VITE_GLOB_SYSTEM_VERSION }}</span>
    </div>
  </Dialog>
</template>
