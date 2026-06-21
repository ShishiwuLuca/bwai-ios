<template>
  <Popup
    v-model:show="innerShow"
    position="center"
    :safe-area-inset-top="true"
    :safe-area-inset-bottom="true"
    class="page-shell-modal p-0.5 !h-full modal flex min-h-0 flex-col !w-full"
    @update:show="onUpdateShow"
  >
    <div class="country-picker__header flex shrink-0 items-center justify-between p-1">
      <div class="country-picker__title text-[0.3rem] font-600">{{
        t('countryPicker_title')
      }}</div>
      <div class="text-[0.25rem] font-600" @click="onUpdateShow(false)">
        <Icon class="country-picker__close" color="#000000" name="cross" :size="22" />
      </div>
    </div>
    <Search
      class="country-picker__search shrink-0"
      shape="round"
      v-model="searchValue"
      :placeholder="t('assets_action_search')"
      @update:model-value="onSearch"
    />
    <div
      class="min-h-0 w-full flex-1 overflow-auto"
      :class="[{ '!pb-6.5': isStandalone }]"
    >
      <Cell
        class="country-picker__cell mb-0.5 !bg-transparent"
        :class="{ 'country-picker__cell--active': isActive(child) }"
        clickable
        center
        size="large"
        v-for="(child, keys) in CountryListTree"
        :key="keys"
        :title="Locales === 'zh_CN' ? child.name : child.nameEn"
        :value="child.areaCode"
        :border="true"
        @click="onSelect(child)"
      >
        <template v-if="props.selectedAreaCode" #right-icon>
          <Radio
            shape="dot"
            :icon-size="16"
            :checked="isActive(child)"
            :name="String(child.areaCode)"
          />
        </template>
      </Cell>
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Popup, Cell, Icon, Search, Radio } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  defineOptions({ name: 'CountryPicker' });

  const props = defineProps<{
    show: boolean;
    selectedAreaCode?: string;
  }>();

  const emit = defineEmits<{
    (_e: 'update:show', _value: boolean): void;
    (_e: 'select', _value: NormalizedCountryItem): void;
  }>();

  const { t } = useI18n();

  const SystemStore = useSystemStoreWithOut();

  const isStandalone = /Safari/i.test(navigator.userAgent);

  const CountryListTree = ref<any[]>([]);

  const searchValue = ref<string>('');

  const Locales = computed(() => {
    return SystemStore.localInfo.locale;
  });

  const CountryList = computed(() => {
    return SystemStore.getCountryList;
  });

  export interface NormalizedCountryItem {
    code: string;
    name: string;
    nameEn?: string;
    areaCode: string;
    index: string;
  }

  const innerShow = ref<boolean>(false);

  watch(
    CountryList,
    (newVal) => {
      if (newVal && newVal.length > 0) {
        CountryListTree.value = newVal;
      }
    },
    { immediate: true, deep: true }
  );

  watch(
    () => props.show,
    (val) => {
      innerShow.value = val;
      if (!val) {
        searchValue.value = '';
        CountryListTree.value = [...(CountryList.value || [])];
      }
    },
    { immediate: true }
  );

  const normArea = (raw: string | number | undefined): string =>
    String(raw ?? '')
      .replace(/^\++/, '')
      .replace(/\s/g, '');

  const isActive = (item: NormalizedCountryItem): boolean => {
    if (!props.selectedAreaCode) return false;
    return normArea(item.areaCode) === normArea(props.selectedAreaCode);
  };

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

  const onUpdateShow = (val: boolean): void => {
    innerShow.value = val;
    emit('update:show', val);
  };

  const onSelect = (item: NormalizedCountryItem): void => {
    emit('select', item);
    onUpdateShow(false);
  };
</script>

<style scoped lang="less">
  .country-picker__title,
  .country-picker__close {
    color: #000000;
  }

  .country-picker__search {
    --van-search-background: transparent;
    padding: 0 0.25rem 0.25rem;
    background: transparent !important;

    :deep(.van-search__content) {
      background: #ffffff;
    }
  }

  &:deep(.van-cell) {
    align-items: center;
  }

  &:deep(.country-picker__cell) {
    color: var(--van-cell-text-color);

    .van-cell__title {
      color: var(--van-cell-text-color);
    }

    .van-cell__value {
      color: var(--van-cell-text-color);
      margin-right: 3px;
    }
  }

  &:deep(.country-picker__cell--active) {
    color: #000000;

    .van-cell__title {
      color: #000000;
    }

    .van-cell__value {
      color: #000000;
    }
  }
</style>
