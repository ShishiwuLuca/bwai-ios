<template>
  <Popup
    v-model:show="innerShow"
    position="center"
    :safe-area-inset-top="true"
    :safe-area-inset-bottom="true"
    class="modal !h-full flex min-h-0 flex-col !w-full"
    @update:show="onUpdateShow"
  >
    <div
      class="flex shrink-0 items-center justify-between p-1 relative z-[10000] bg-[var(--van-background)]"
    >
      <div class="text-[0.3rem] font-bold z-10 text-[var(--van-text-color)]">{{
        t('countryPicker_title')
      }}</div>
      <div class="text-[var(--van-text-color)]" @click="onUpdateShow(false)">
        <Icon name="cross" :size="25" />
      </div>
    </div>
    <Search
      shape="round"
      v-model="searchValue"
      :placeholder="t('assets_action_search')"
      @update:model-value="onSearch"
    />
    <div
      class="w-full flex-1 overflow-auto pb-6 bg-[var(--van-card-background)]"
      :style="{ height: 'calc(100vh - 54px)' }"
    >
      <Cell
        center
        clickable
        size="large"
        :border="false"
        v-for="(child, keys) in CountryListTree"
        :key="keys"
        :title="Locales === 'zh_CN' ? child.name : child.nameEn"
        :value="child.areaCode"
        @click="onSelect(child)"
      />
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Popup, Cell, Icon, Search } from 'vant';
  // import { buildCountryTreeByCode } from '/@/service/System';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  // 组件名称
  defineOptions({ name: 'CountryPicker' });

  // 组件对外 props（由父组件用 v-model:show 控制弹窗展示）

  /** props */
  const props = defineProps<{
    show: boolean;
  }>();

  // 组件对外事件

  /** emit */
  const emit = defineEmits<{
    // 更新弹窗显示状态
    (_e: 'update:show', _value: boolean): void;
    // 选中某个国家
    (_e: 'select', _value: NormalizedCountryItem): void;
  }>();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 当前选中的索引
  // const currentIndex = ref<string>('A');

  // 国家列表Tree数组

  /** 响应式状态：CountryListTree 相关 UI 或数据 */
  const CountryListTree = ref<any[]>([]);

  // 搜索值

  /** 响应式状态：searchValue 相关 UI 或数据 */
  const searchValue = ref<string>('');

  // 当前系统语言

  /** 计算属性：由其它状态派生的展示或判断 */
  const Locales = computed(() => {
    return SystemStore.localInfo.locale;
  });

  // 国家区号列表

  /** 计算属性：列表数据 */
  const CountryList = computed(() => {
    return SystemStore.getCountryList;
  });

  // ---------------------------------------------------------------------------
  // 类型定义与数据结构
  // ---------------------------------------------------------------------------

  // 统一后的国家结构（适配后端字段）

  /** NormalizedCountryItem：接口数据结构定义 */
  export interface NormalizedCountryItem {
    // 国家编码，如 CN / US
    code: string;
    // 国家中文名
    name: string;
    // 国家英文名
    nameEn?: string;
    // 区号，如 86 / 1
    areaCode: string;
    // 索引字母，如 C / U
    index: string;
  }

  // 弹窗内部显示状态，与 props.show 双向同步

  /** 响应式状态：显隐控制 */
  const innerShow = ref<boolean>(false);

  // 监听国家区号列表变化

  /** 侦听依赖变化并触发副作用 */
  watch(
    CountryList,
    (newVal) => {
      if (newVal && newVal.length > 0) {
        CountryListTree.value = newVal;
      }
    },
    { immediate: true, deep: true }
  );

  // 外部 v-model:show 改变时，同步内部状态

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.show,
    (val) => {
      innerShow.value = val;
    },
    { immediate: true }
  );

  /** 区号去 +、空格后比较，支持搜「86」「+86」等 */
  const normArea = (raw: string | number | undefined): string =>
    String(raw ?? '')
      .replace(/^\++/, '')
      .replace(/\s/g, '');

  // 搜索：国家名 + 区号；始终对全量 CountryList 过滤，避免逐字在已缩小的列表上再搜

  /** 事件或回调处理：onSearch */
  const onSearch = (val: string): void => {
    const source = CountryList.value || [];
    const q = (val || '').trim();
    if (!q) {
      CountryListTree.value = [...source];
      return;
    }
    const isZh = Locales.value === 'zh_CN';
    const qName = isZh ? q : q.toLowerCase();
    const qArea = normArea(q);

    CountryListTree.value = source.filter((item: any) => {
      const nameZh = String(item.name ?? '');
      const nameEn = String(item.nameEn ?? '');
      const nameMatch = isZh ? nameZh.includes(q) : nameEn.toLowerCase().includes(qName);
      const ac = normArea(item.areaCode);
      const codeMatch = qArea.length > 0 && ac.length > 0 && ac.includes(qArea);
      return nameMatch || codeMatch;
    });
  };

  // 内部更新 show 时，通知父组件

  /** 显隐控制：onUpdateShow */
  const onUpdateShow = (val: boolean): void => {
    innerShow.value = val;
    emit('update:show', val);
  };

  // 选择某个国家后，发出事件并关闭弹窗

  /** 事件或回调处理：onSelect */
  const onSelect = (item: NormalizedCountryItem): void => {
    emit('select', item);
    onUpdateShow(false);
  };
</script>

<style scoped lang="less">
  // :deep(.van-index-anchor) {
  //   transform: translate3d(0px, 53px, 0px) !important;
  // }

  .country-picker {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .country-picker__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.24rem 0.32rem 0.16rem;
    border-bottom: 1px solid var(--van-border-color);
  }

  .country-picker__title {
    font-size: 0.3rem;
    font-weight: 600;
  }

  .country-picker__close {
    min-width: 1.2rem;
  }

  .country-picker__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .country-picker__cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .country-picker__cell-main {
    display: flex;
    flex-direction: column;
  }

  .country-picker__cell-name {
    font-size: 0.28rem;
  }

  .country-picker__cell-sub {
    font-size: 0.22rem;
    color: var(--van-text-color-2);
  }

  .country-picker__cell-code {
    font-size: 0.26rem;
    color: var(--van-text-color-2);
  }

  :deep(.van-popup__close-icon--top-right) {
    z-index: 10;
  }
</style>
