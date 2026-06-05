<template>
  <PageWrap class="salary-page">
    <NavBar :title="t('sd_title')" left-arrow fixed placeholder :border="false" />

    <div class="salary-page__content">
      <div class="salary-page__card">
        <div class="salary-page__head">
          <span class="salary-page__head-col">{{ t('sd_task_date') }}</span>
          <span class="salary-page__head-col">{{ t('sd_claim_amount') }}</span>
          <span class="salary-page__head-col">{{ t('sd_claim_status') }}</span>
        </div>
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loading"
            :immediate-check="false"
            :finished="finished"
            :finished-text="finishedText"
            @load="onLoad"
          >
            <template v-if="list.length === 0 && !loading">
              <div class="salary-page__empty">
                <Icon name="description" class="salary-page__empty-icon" />
                <span class="salary-page__empty-text">{{ t('sd_no_data') }}</span>
              </div>
            </template>
            <div
              v-else
              v-for="(row, i) in list"
              :key="row.bizDate + '-' + i"
              class="salary-page__row"
            >
              <span class="salary-page__row-col">{{ formatDate(row.bizDate) }}</span>
              <span class="salary-page__row-col">{{ formatAmount(row.totalEarned) }}</span>
              <span class="salary-page__row-col">{{ formatClaimStatus(row.claimStatus) }}</span>
            </div>
          </List>
        </PullRefresh>
      </div>

      <!-- <div class="salary-page__note">
            <p class="salary-page__note-line">{{ t('sd_note_intro') }}</p>
            <p class="salary-page__note-line">{{ t('sd_note_pending') }}</p>
            <p class="salary-page__note-line">{{ t('sd_note_success') }}</p>
            <p class="salary-page__note-line">{{ t('sd_note_fail') }}</p>
          </div> -->
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { PullRefresh, List, Icon } from 'vant';
  import {
    getWageRecord,
    WageRecordClaimStatus,

    /** AppActTaskWageRecordItemVO：类型别名 */
    type AppActTaskWageRecordItemVO
  } from '/@/service/Task';
  import { useI18n } from '/@/hooks/web/useI18n';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 格式化展示：formatClaimStatus */
  const formatClaimStatus = (status: number | undefined): string => {
    /** s */
    const s = status ?? -1;
    if (s === WageRecordClaimStatus.Pending) return t('sd_audit_pending');
    if (s === WageRecordClaimStatus.Success) return t('sd_audit_success');
    if (s === WageRecordClaimStatus.Failed) return t('sd_audit_failed');
    return t('sd_pay_unknown');
  };

  /** 金额输入：formatAmount */
  const formatAmount = (v: number | undefined): string => {
    /** n */
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return Number.isInteger(n) ? String(n) : String(n);
  };

  /** 格式化展示：formatDate */
  const formatDate = (bizDate: string | number[] | unknown): string => {
    if (typeof bizDate === 'string') {
      return bizDate.replace(/-/g, '/');
    }
    if (Array.isArray(bizDate) && bizDate.length >= 3) {
      const [y, m, d] = bizDate;
      return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    }
    return String(bizDate ?? '-');
  };
  const list = ref<AppActTaskWageRecordItemVO[]>([]);
  const pageNo = ref(1);
  const pageSize = 10;
  const total = ref(0);
  const loading = ref(false);
  const refreshing = ref(false);
  const finished = ref(false);
  const finishedText = computed(() => (list.value.length === 0 ? '' : t('no_more')));
  const fetchList = (isRefresh: boolean) => {
    if (isRefresh) {
      pageNo.value = 1;
      finished.value = false;
    }
    if (loading.value) return;
    loading.value = true;
    getWageRecord({
      pageNo: pageNo.value,
      pageSize
    })
      .then((res) => {
        if (res?.code !== 0) {
          finished.value = true;
          return;
        }
        const data = res.data;
        const items = data?.list ?? [];
        const totalCount = data?.total ?? 0;
        if (isRefresh) {
          list.value = items;
        } else {
          list.value = list.value.concat(items);
        }
        total.value = totalCount;
        const noMore =
          items.length === 0 ||
          items.length < pageSize ||
          (totalCount > 0 && list.value.length >= totalCount);
        finished.value = noMore;
        if (!noMore) {
          pageNo.value += 1;
        }
      })
      .catch(() => {
        finished.value = true;
      })
      .finally(() => {
        loading.value = false;
        refreshing.value = false;
      });
  };
  const onRefresh = () => {
    refreshing.value = true;
    void fetchList(true);
  };
  const onLoad = () => {
    void fetchList(false);
  };
  onMounted(() => {
    onLoad();
  });
</script>

<style scoped lang="less">
  .salary-page {
    min-height: 100vh;
    background: #0a0e1a;
    color: #fff;
  }

  .salary-page__content {
    padding: 0.32rem;
  }

  .salary-page__card {
    border-radius: 0.24rem;
    overflow: hidden;
    background: #161b2e;
  }

  .salary-page__head {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 0.8fr;
    padding: 0.2rem 0.24rem;
    font-size: 0.26rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(90deg, #1a6fd4 0%, #2a8ae8 100%);
  }

  .salary-page__head-col {
    text-align: center;
  }

  .salary-page__head-col:first-child {
    text-align: left;
  }

  .salary-page__row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 0.8fr;
    padding: 0.24rem 0.24rem;
    font-size: 0.26rem;
    color: rgba(255, 255, 255, 0.94);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .salary-page__row:last-child {
    border-bottom: none;
  }

  .salary-page__row-col {
    text-align: center;
  }

  .salary-page__row-col:first-child {
    text-align: left;
    color: rgba(255, 255, 255, 0.9);
  }

  .salary-page__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2rem 0;
    color: rgba(255, 255, 255, 0.55);
  }

  .salary-page__empty-icon {
    font-size: 1.2rem;
    margin-bottom: 0.24rem;
    opacity: 0.6;
  }

  .salary-page__empty-text {
    font-size: 0.28rem;
  }

  .salary-page__note {
    margin-top: 0.32rem;
    padding: 0.28rem 0.32rem;
    border-radius: 0.24rem;
    background: #161b2e;
    color: rgba(255, 255, 255, 0.88);
    font-size: 0.24rem;
    line-height: 1.65;
  }

  .salary-page__note-line {
    margin: 0;
  }

  .salary-page__note-line + .salary-page__note-line {
    margin-top: 0.12rem;
  }

  :deep(.van-pull-refresh__head) {
    color: rgba(255, 255, 255, 0.6);
  }

  :deep(.van-list__loading),
  :deep(.van-list__finished-text) {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.24rem;
    padding: 0.2rem 0;
  }
</style>
