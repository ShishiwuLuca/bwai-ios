<template>
  <Popup
    :show="showAppUpdateDialog"
    position="center"
    :close-on-click-overlay="!forceUpdate"
    class="app-update-dialog__popup !w-[80%] max-w-[6.8rem] !overflow-inherit"
    @update:show="onPopupUpdateShow"
  >
    <div class="relative w-full">
      <button
        v-if="!forceUpdate"
        type="button"
        class="absolute -top-5 -right-2 z-[2] flex h-[0.56rem] w-[0.56rem] cursor-pointer items-center justify-center rounded-full border-2 border-[#3b82f6] bg-white p-0 text-[#3b82f6]"
        aria-label="关闭"
        @click="onClose"
      >
        <Icon name="cross" :size="20" />
      </button>
      <div
        class="w-full rounded-[0.32rem] overflow-hidden bg-white shadow-[0_0.4rem_1.2rem_rgba(0,0,0,0.2)]"
      >
        <div
          class="min-h-[1.6rem] bg-[linear-gradient(180deg,#60a5fa_0%,#3b82f6_50%,#2563eb_100%)] px-[0.4rem] pb-[0.36rem] pt-[0.44rem]"
        >
          <div class="relative z-[1]">
            <div class="text-[0.4rem] font-bold leading-tight text-white flex items-center gap-1">
              {{ t('app_update_title') }}
              <span
                class="rounded-full border border-white/80 bg-white/95 px-[0.2rem] py-[0.06rem] text-[0.26rem] font-semibold text-[#1d4ed8]"
              >
                {{ displayNewVersion }}
              </span>
            </div>
            <div class="mt-[0.12rem] text-[0.26rem] text-white/95">
              {{ t('app_update_current_version') }} {{ displayCurrentVersion }}
            </div>
          </div>
          <div class="pointer-events-none fixed top-[-0.5rem] right-[-0.5rem] z-0 w-[40%]">
            <img :src="RocketImg" alt="" class="h-full w-full object-contain object-right-bottom" />
          </div>
        </div>

        <div class="bg-white px-[0.4rem] pb-[0.28rem] pt-[0.32rem]">
          <div class="mb-[0.2rem] text-[0.3rem] font-semibold text-[#1f2937]">
            {{ t('app_update_content_title') }}
          </div>
          <ul
            v-if="displayContentList.length"
            class="list-decimal pl-[0.36rem] text-[0.26rem] leading-relaxed text-[#4b5563]"
          >
            <li v-for="(_item, index) in displayContentList" :key="index" class="mb-[0.1rem]">
              {{ t('app_version_update_hint') }}
            </li>
          </ul>
        </div>

        <div v-if="downloadProgress?.active" class="px-[0.4rem] pb-[0.2rem]">
          <Progress
            :percentage="downloadProgress.percent"
            stroke-width="10"
            :show-pivot="true"
            color="linear-gradient(90deg,#60a5fa,#2563eb)"
          />
          <div class="mt-[0.14rem] text-center text-[0.24rem] leading-snug text-[#6b7280]">
            {{ downloadProgress.percent }}% · {{ downloadProgress.loadedMb }} MB<span
              v-if="downloadProgress.totalMb !== '--'"
            >
              / {{ downloadProgress.totalMb }} MB</span
            >
          </div>
        </div>

        <div class="pb-[0.4rem] px-[0.4rem]">
          <Button
            type="primary"
            block
            round
            :disabled="!!downloadProgress?.active"
            class="!h-[0.88rem] !border-0 !text-[0.32rem] !font-semibold !bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)]"
            @click="onUpdate"
          >
            {{ t('app_update_button') }}
          </Button>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import RocketImg from '/@/assets/images/upgrade.png';
  import { Popup, Icon, Button, Progress } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  defineOptions({ name: 'AppUpdateDialog' });

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 是否显示弹窗：从 SystemStore 读取，在组件内部维护

  /** 计算属性：显隐控制 */
  const showAppUpdateDialog = computed(() => SystemStore.showAppUpdateDialog);

  /** props */
  const props = withDefaults(
    defineProps<{
      /** 当前版本，如 V.2.28.2 */
      currentVersion?: string;
      /** 新版本，如 V.231.01 */
      newVersion?: string;
      /** 更新内容列表 */
      contentList?: string[];
    }>(),
    {
      currentVersion: '',
      newVersion: '',
      contentList: () => []
    }
  );

  /** 计算属性：拉取接口数据 */
  const dialogPayload = computed(() => SystemStore.appUpdateDialogPayload);

  /** 计算属性：由其它状态派生的展示或判断 */
  const forceUpdate = computed(() => dialogPayload.value?.forceUpdate ?? false);

  /** 计算属性：拉取接口数据 */
  const downloadProgress = computed(() => SystemStore.appUpdateDownloadProgress);

  /** 计算属性：由其它状态派生的展示或判断 */
  const displayCurrentVersion = computed(
    () => props.currentVersion || dialogPayload.value?.currentVersion || ''
  );

  /** 计算属性：由其它状态派生的展示或判断 */
  const displayNewVersion = computed(
    () => props.newVersion || dialogPayload.value?.newVersion || ''
  );

  /** 计算属性：列表数据 */
  const displayContentList = computed(() => {
    if (props.contentList?.length) return props.contentList;
    return dialogPayload.value?.contentList ?? [];
  });

  /** emit */
  const emit = defineEmits<{
    (_e: 'close'): void;
    (_e: 'update'): void;
  }>();

  /** 显隐控制：onPopupUpdateShow */
  const onPopupUpdateShow = (value: boolean): void => {
    SystemStore.setShowAppUpdateDialog(value);
    if (!value) emit('close');
  };

  /** 事件或回调处理：onClose */
  const onClose = (): void => {
    SystemStore.setShowAppUpdateDialog(false);
    emit('close');
  };

  /** 事件或回调处理：onUpdate */
  const onUpdate = (): void => {
    emit('update');
  };
</script>

<style lang="less" scoped>
  /* 仅保留穿透 Popup 的样式，其余已改为 UnoCSS */
  .app-update-dialog__popup :deep(.van-popup) {
    background: transparent;
    padding: 0.4rem;
    box-sizing: border-box;
  }
</style>
