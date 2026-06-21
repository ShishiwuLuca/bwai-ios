<template>
  <div class="lang-settings-page">
    <NavBar :title="t('language_title')" />
    <PageWrap>
      <div class="p-[0.32rem]">
        <div class="lang-settings-page__card">
          <div
            v-for="(item, idx) in LocaleList"
            :key="item.value"
            class="lang-settings-page__item"
            :class="{ 'lang-settings-page__item--last': idx === LocaleList.length - 1 }"
            @click="onSelect(item)"
          >
            <span class="lang-settings-page__label">{{ item.label }}</span>
            <Radio
              v-if="item.value === CurrentLocale"
              shape="dot"
              :icon-size="16"
              :checked="true"
              :name="item.value"
              checked-color="#2071f8"
            />
          </div>
        </div>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { computed } from 'vue';
  import { Radio } from 'vant';
  import { NavBar, PageWrap } from '/@/components';
  import { useLocale } from '/@/locales/useLocale';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  const { t } = useI18n();
  const SystemStore = useSystemStoreWithOut();
  const { changeLocale } = useLocale();
  const { CreateLoadingToast } = useMessage();

  const LocaleList = computed(() => SystemStore.getLocaleList);
  const CurrentLocale = computed(() => SystemStore.getLocaleInfo.locale);

  const onSelect = async (item: any) => {
    if (item.value === CurrentLocale.value) return;
    try {
      CreateLoadingToast('Loading');
      SystemStore.setLocaleInfo(item);
      await changeLocale(item.value);
    } catch (error) {
      console.error('Language switch failed:', error);
    }
  };
</script>

<style lang="less" scoped>
  .lang-settings-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) {
      background: transparent !important;
    }

    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000 !important;
    }

    :deep(.page-wrap) {
      background: transparent;
    }
  }

  .lang-settings-page__card {
    background: #f9faff;
    border-radius: 0.16rem;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
    overflow: hidden;
  }

  .lang-settings-page__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.28rem 0.32rem;
    border-bottom: 1px dashed #e8eaf2;

    &--last {
      border-bottom: none;
    }
  }

  .lang-settings-page__label {
    font-size: 0.28rem;
    color: #000;
  }

  :deep(.van-radio__icon--checked) {
    border-color: #2071f8 !important;
  }

  :deep(.van-radio__icon--dot__icon) {
    background: #2071f8 !important;
  }
</style>
