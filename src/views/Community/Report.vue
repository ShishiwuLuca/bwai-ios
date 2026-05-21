<template>
  <PageWrap class="report-page">
    <NavBar :title="t('rp_nav_title')" left-arrow fixed placeholder :border="false" />
    <div class="report-page__body">
      <p class="report-page__label">{{ t('rp_type_label') }}</p>
      <RadioGroup v-model="reportType" class="report-page__radios">
        <CellGroup inset>
          <Cell
            v-for="opt in reportTypeOptions"
            :key="opt.value"
            :title="opt.label"
            clickable
            @click="reportType = opt.value"
          >
            <template #right-icon>
              <Radio :name="opt.value" />
            </template>
          </Cell>
        </CellGroup>
      </RadioGroup>

      <p class="report-page__label report-page__label--mt">{{ t('rp_extra_label') }}</p>
      <Field
        v-model="reportReason"
        type="textarea"
        rows="5"
        maxlength="500"
        show-word-limit
        :placeholder="t('rp_reason_placeholder')"
        class="report-page__field"
      />

      <Button
        type="primary"
        block
        round
        class="report-page__btn"
        :loading="submitLoading"
        :disabled="submitLoading"
        @click="onSubmit"
      >
        {{ t('confirm') }}
      </Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Field, Button, RadioGroup, Radio, Cell, CellGroup } from 'vant';
  import { createMarketingPostReport } from '/@/service/MarketingPost';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isApiSuccess } from '/@/utils/apiResult';

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateErrorToast, CreateSuccessToast } = useMessage();

  // —— query.id → 举报类型与说明 → 提交接口 ——

  /** 被举报的帖子 id（云社区跳转 query.id） */
  const reportPostId = computed(() => {
    const raw = route.query.id;
    if (raw == null || raw === '') return null;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  /** 1-5 与后端 reportType 一致 */
  const reportTypeOptions = computed(() => [
    { value: 1, label: t('rp_type_1') },
    { value: 2, label: t('rp_type_2') },
    { value: 3, label: t('rp_type_3') },
    { value: 4, label: t('rp_type_4') },
    { value: 5, label: t('rp_type_5') }
  ]);

  /** 响应式状态：reportType 相关 UI 或数据 */
  const reportType = ref<number>(1);

  /** 响应式状态：reportReason 相关 UI 或数据 */
  const reportReason = ref('');

  /** 响应式状态：加载中状态 */
  const submitLoading = ref(false);

  /** 提交中（onSubmit） */
  const onSubmit = async () => {
    const postId = reportPostId.value;
    if (postId == null) {
      CreateErrorToast(t('rp_missing_post'));
      return;
    }
    const rt = Number(reportType.value);
    if (!Number.isFinite(rt) || rt < 1 || rt > 5) {
      CreateErrorToast(t('rp_select_type'));
      return;
    }
    submitLoading.value = true;
    try {
      const res = await createMarketingPostReport({
        postId,
        reportType: rt,
        reportReason: reportReason.value.trim() || undefined
      });
      if (isApiSuccess(res)) {
        CreateSuccessToast(t('dt_submit_success'));
        router.back();
      } else {
        CreateErrorToast(res?.msg || t('dt_submit_fail'));
      }
    } catch {
      CreateErrorToast(t('cm_network_error'));
    } finally {
      submitLoading.value = false;
    }
  };
</script>

<style scoped lang="less">
  /* 表单区：类型单选 + 补充说明 */

  .report-page {
    color: var(--van-text-color);
  }

  .report-page__body {
    padding: 0.32rem;
  }

  .report-page__label {
    margin: 0 0 0.2rem;
    font-size: 0.28rem;
    font-weight: 600;
    color: var(--van-text-color);
  }

  .report-page__label--mt {
    margin-top: 0.36rem;
  }

  .report-page__radios {
    :deep(.van-cell-group--inset) {
      margin: 0;
      border-radius: 0.16rem;
      overflow: hidden;
    }
  }

  .report-page__field {
    margin-top: 0.12rem;
  }

  .report-page__field :deep(.van-cell) {
    background: var(--van-field-background);
    border-radius: 0.16rem;
    padding: 0.2rem;
  }

  .report-page__field :deep(.van-field__control) {
    color: var(--van-text-color);
  }

  .report-page__btn {
    margin-top: 0.4rem;
    height: 0.88rem;
  }
</style>
