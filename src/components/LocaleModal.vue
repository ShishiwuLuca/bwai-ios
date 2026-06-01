<template>
  <Popup
    v-model:show="ShowModal"
    position="center"
    :safe-area-inset-top="true"
    :safe-area-inset-bottom="true"
    class="p-0.5 !h-full modal flex min-h-0 flex-col !w-full"
  >
    <div class="flex shrink-0 items-center justify-between p-1">
      <div class="text-[0.3rem] font-600 text-[var(--van-text-color)]">{{
        t('customSetting_action_language')
      }}</div>
      <div class="text-[0.25rem] font-600" @click="ClosePicker">
        <Icon color="var(--van-text-color)" name="cross" :size="22" />
      </div>
    </div>
    <div class="min-h-0 w-full flex-1 overflow-auto" :class="[{ '!pb-6.5': isStandalone }]">
      <Cell
        class="mb-0.5 !bg-transparent"
        :class="[{ '!text-white': item.value === Locales }]"
        clickable
        center
        size="large"
        v-for="(item, index) in LocaleList"
        :key="index"
        :title="item.label"
        @click="SelectLocale(item)"
        :border="true"
      >
        <template #icon>
          <Icon :name="item.icon" class="mr-1 rtl:mr-0 rtl:ml-1" :size="28" />
        </template>
        <template #right-icon>
          <Radio shape="dot" :icon-size="23" :checked="Locales === item.value" :name="item.value" />
        </template>
      </Cell>
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { onEvent } from '/@/utils/eventBus';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Popup, Cell, Icon, Radio } from 'vant';
  import { useLocale } from '/@/locales/useLocale';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** isStandalone */
  const isStandalone = /Safari/i.test(navigator.userAgent);

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { changeLocale } = useLocale();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateLoadingToast } = useMessage();

  // 是否显示弹窗

  /** 响应式状态：显隐控制 */
  const ShowModal = ref<boolean>(false);

  // 语言列表

  /** 计算属性：列表数据 */
  const LocaleList: any = computed(() => {
    return SystemStore.getLocaleList;
  });

  // 当前使用的语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const Locales = computed(() => {
    return SystemStore.getLocaleInfo.locale;
  });

  // 切换语言

  /** 方法：SelectLocale */
  const SelectLocale = async (item: any): Promise<void> => {
    try {
      CreateLoadingToast('Loading');

      // 切换语言
      SystemStore.setLocaleInfo(item);

      // 修改框架语言
      await changeLocale(item.value);

      // 关闭
      ShowModal.value = false;
    } catch (error) {
      console.error('Language switch failed:', error);
      // 可以在这里添加错误提示
    }
  };

  // 回调函数

  /** ClosePicker */
  const ClosePicker = (): void => {
    // 关闭Picker
    ShowModal.value = false;
  };

  // 打开语言切换弹窗

  /** OpenLocaleModal */
  const OpenLocaleModal = () => {
    ShowModal.value = true;
  };

  // 监听事件
  onEvent('ShowLocales', () => {
    ShowModal.value = true;
  });

  // 暴漏
  defineExpose({
    OpenLocaleModal
  });
</script>

<style lang="less" scoped>
  &:deep(.van-cell) {
    align-items: center;
  }

  &:deep(.van-popover__wrapper) {
    width: 100%;
  }
</style>
