<template>
  <div class="tx-history-page">
    <NavBar :title="t('str_transaction_history')">
      <template #right>
        <div class="tx-nav-filter" @click="openFilterPopup">
          <Icon name="filter-o" :size="20" color="#000" />
        </div>
      </template>
    </NavBar>
    <PageWrap>
      <div>
        <div v-if="showFilterBar" class="flex items-center justify-between gap-1 rounded-sm p-0.5">
          <div class="flex items-center gap-1">
            <div class="text-[0.28rem] text-[#333]">{{ t('str_account') }}:</div>
            <Popover
              v-model:show="showAccountPopover"
              :actions="accountOptions"
              placement="bottom"
              @select="onSelectAccount"
            >
              <template #reference>
                <div class="tx-filter-trigger">
                  <span class="truncate">{{ selectedAccount.text }}</span>
                  <Icon name="arrow-down" />
                </div>
              </template>
            </Popover>
          </div>
          <div class="flex items-center gap-1">
            <div class="text-[0.28rem] text-[#333]">类型:</div>
            <Popover
              v-model:show="showStatusPopover"
              :actions="statusOptions"
              :offset="[-8, 8]"
              placement="bottom"
              @select="onSelectStatus"
            >
              <template #reference>
                <div class="tx-filter-trigger">
                  <span class="truncate">{{ selectedStatus.text }}</span>
                  <Icon name="arrow-down" />
                </div>
              </template>
            </Popover>
          </div>
        </div>
        <PullRefresh
          v-model="refreshing"
          @refresh="onRefresh"
          class="!overflow-auto p-1"
          :style="{
            height: showFilterBar
              ? 'calc(100vh - var(--van-nav-bar-height) - 1.2rem)'
              : 'calc(100vh - var(--van-nav-bar-height))'
          }"
        >
          <List
            v-model:loading="loading"
            :immediate-check="false"
            :finished="finished"
            @load="onLoad"
          >
            <template #finished>
              <Empty
                v-if="TransactionHistoryList.length < 1"
                image="search"
                :description="t('no_more')"
              />
              <span v-else>{{ t('no_more') }}</span>
            </template>
            <Cell
              v-for="(item, index) in TransactionHistoryList"
              :key="index"
              :title="item.fundName"
              :value="formatTxAmountValue(item)"
              :label="getToDateTime(item.ctime).format('YYYY-MM-DD HH:mm:ss')"
              clickable
              center
              size="large"
              title-class="!text-[#000] !font-medium"
              label-class="!text-[#8c8c8c]"
              class="tx-history-page__cell rounded-sm !pt-1 !pb-1 mb-1"
              :value-class="[
                '!font-bold !text-[0.35rem]',
                {
                  '!text-[var(--van-down-color)]': isTxAmountCredit(item),
                  '!text-[var(--van-top-color)]': !isTxAmountCredit(item)
                }
              ]"
              :border="false"
            >
              <template #icon>
                <Icon :name="item.image" :size="50" class="mr-0.5" />
              </template>
            </Cell>
          </List>
          <BackTop :offset="20" :right="10" :bottom="70" />
        </PullRefresh>
      </div>
    </PageWrap>

    <!-- 筛选弹窗 -->
    <Popup
      v-model:show="showFilterPopup"
      position="bottom"
      round
      safe-area-inset-bottom
      class="tx-filter-popup modal !w-full"
    >
      <div class="tx-filter-panel">
        <div class="tx-filter-section">
          <div class="tx-filter-label">{{ t('tx_filter_type') }}</div>
          <div class="tx-filter-type-grid">
            <button
              v-for="item in typeFilterOptions"
              :key="item.code"
              type="button"
              class="tx-filter-type-item"
              :class="{ 'tx-filter-type-item--active': filterDraft.btype === item.code }"
              @click="toggleFilterType(item.code)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>

        <div class="tx-filter-section">
          <div class="tx-filter-label">{{ t('tx_filter_date') }}</div>
          <div class="tx-filter-date-row">
            <div class="tx-filter-date-box" @click="openDatePicker('start')">
              {{ filterDraft.startDate || t('tx_filter_start') }}
            </div>
            <span class="tx-filter-date-to">{{ t('rrd_to') }}</span>
            <div class="tx-filter-date-box" @click="openDatePicker('end')">
              {{ filterDraft.endDate || t('tx_filter_end') }}
            </div>
          </div>
        </div>

        <div class="tx-filter-actions">
          <Button class="tx-filter-btn tx-filter-btn--reset" round @click="onResetFilter">
            {{ t('tx_filter_reset') }}
          </Button>
          <Button class="tx-filter-btn tx-filter-btn--confirm" type="primary" round @click="onConfirmFilter">
            {{ t('confirm') }}
          </Button>
        </div>
      </div>
    </Popup>

    <!-- 日期选择 -->
    <Popup v-model:show="showDatePicker" position="bottom" round class="modal !w-full">
      <DatePicker
        v-model="pickerDate"
        :title="t('rrd_select_date')"
        :columns-type="['year', 'month', 'day']"
        @confirm="onConfirmDate"
        @cancel="showDatePicker = false"
      />
    </Popup>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import type { PopoverAction } from 'vant';
  import { computed, ref, onBeforeMount } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { getToDateTime } from '/@/utils/TimeZone';
  import {
    getMyWalletInfo,
    getWalletTransactionHistory,
    getFundTypeList,
    type FundTypeDO
  } from '/@/service/Wallet';
  import {
    PullRefresh,
    List,
    Empty,
    BackTop,
    Cell,
    Icon,
    Popover,
    Popup,
    Button,
    DatePicker
  } from 'vant';

  interface TxFilterDraft {
    fundCode: string;
    btype: string;
    startDate: string;
    endDate: string;
  }

  const createEmptyFilter = (): TxFilterDraft => ({
    fundCode: '',
    btype: '',
    startDate: '',
    endDate: ''
  });

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 计算属性：由其它状态派生的展示或判断 */
  const routeType = computed(() => {
    const raw = route.query.type;
    if (Array.isArray(raw)) return raw[0];
    return raw;
  });

  /** 响应式状态：显隐控制 */
  const showFilterBar = ref<boolean>(false);
  const showAccountPopover = ref(false);
  const showStatusPopover = ref(false);
  const showFilterPopup = ref(false);
  const showDatePicker = ref(false);

  /** 响应式状态：accountOptions 相关 UI 或数据 */
  const accountOptions = ref<PopoverAction[]>([]);

  /** 响应式状态：筛选类型选项（接口 getFundTypeList 返回，code 即 btype） */
  const typeFilterOptions = ref<FundTypeDO[]>([]);

  /** 响应式状态：selectedAccount 相关 UI 或数据 */
  const selectedAccount = ref<any>({});

  /** statusOptions */
  const statusOptions = computed<PopoverAction[]>(() => [
    { text: t('mc_status_all'), value: null },
    { text: t('mc_status_pending'), value: 0 },
    { text: t('mc_tab_passed'), value: 1 },
    { text: t('mc_tab_rejected'), value: 2 }
  ]);

  /** 响应式状态：selectedStatus 相关 UI 或数据 */
  const selectedStatus = ref<PopoverAction>({ text: t('mc_status_all'), value: '' });

  /** 响应式状态：日期选择目标 */
  const pickerTarget = ref<'start' | 'end'>('start');
  const pickerDate = ref<string[]>([]);

  /** 响应式状态：筛选草稿 */
  const filterDraft = ref<TxFilterDraft>(createEmptyFilter());

  /** 响应式状态：下拉刷新 */
  const refreshing = ref<boolean>(false);

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref<boolean>(false);

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    pageNo: 1,
    pageSize: 10
  });

  /** 响应式状态：列表数据 */
  const TransactionHistoryList = ref<any[]>([]);

  const TX_CREDIT_CODES = ['F034', 'F035', 'F040', 'F041', 'F042'];
  const TX_DEBIT_CODES = ['F036', 'F037', 'F038', 'F039'];

  const isTxAmountCredit = (item: any) => {
    const code = String(item.fundCode ?? '').toUpperCase();
    if (TX_CREDIT_CODES.includes(code)) return true;
    if (TX_DEBIT_CODES.includes(code)) return false;
    return item.toBalance > item.fromBalance;
  };

  const formatTxAmountValue = (item: any) =>
    `${isTxAmountCredit(item) ? '+' : '-'}${item.amount}`;

  /** 事件或回调处理：getTransactionTypeImage */
  const getTransactionTypeImage = (type: string) => {
    return new URL(`../../assets/svg/${type}.svg`, import.meta.url).href;
  };

  /** formatDate */
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  /** 打开筛选弹窗 */
  const openFilterPopup = () => {
    showFilterPopup.value = true;
  };

  /** 切换类型筛选（单选，再次点击取消选中） */
  const toggleFilterType = (code: string) => {
    filterDraft.value.btype = filterDraft.value.btype === code ? '' : code;
  };

  /** 打开日期选择 */
  const openDatePicker = (target: 'start' | 'end') => {
    pickerTarget.value = target;
    const base = target === 'start' ? filterDraft.value.startDate : filterDraft.value.endDate;
    const d = base ? new Date(base.replace(/-/g, '/')) : new Date();
    const cur = Number.isNaN(d.getTime()) ? new Date() : d;
    pickerDate.value = [
      String(cur.getFullYear()),
      String(cur.getMonth() + 1),
      String(cur.getDate())
    ];
    showDatePicker.value = true;
  };

  /** 确认日期 */
  const onConfirmDate = (value: unknown) => {
    const arr = Array.isArray(value)
      ? value
      : (value as { selectedValues?: string[] })?.selectedValues || pickerDate.value;
    const [y, m, day] = arr;
    const text = formatDate(new Date(Number(y), Number(m) - 1, Number(day)));
    if (pickerTarget.value === 'start') {
      filterDraft.value.startDate = text;
    } else {
      filterDraft.value.endDate = text;
    }
    showDatePicker.value = false;
  };

  /** 将筛选条件写入查询参数 */
  const applyFilterToParams = () => {
    const draft = filterDraft.value;
    const fundCode = String(draft.fundCode || '').trim();
    if (fundCode) {
      inputParams.value.fundCode = fundCode;
    } else {
      delete inputParams.value.fundCode;
    }

    if (draft.btype) {
      inputParams.value.btype = draft.btype;
    } else {
      delete inputParams.value.btype;
    }

    if (draft.startDate) {
      inputParams.value.timeFrom = getToDateTime(draft.startDate).startOf('day').valueOf();
    } else {
      delete inputParams.value.timeFrom;
    }

    if (draft.endDate) {
      inputParams.value.timeTo = getToDateTime(draft.endDate).endOf('day').valueOf();
    } else {
      delete inputParams.value.timeTo;
    }
  };

  /** 重置筛选 */
  const onResetFilter = () => {
    filterDraft.value = createEmptyFilter();
    applyFilterToParams();
    showFilterPopup.value = false;
    onRefresh();
  };

  /** 确认筛选 */
  const onConfirmFilter = () => {
    applyFilterToParams();
    showFilterPopup.value = false;
    onRefresh();
  };

  /** 下拉刷新：onRefresh */
  const onRefresh = (): void => {
    inputParams.value.pageNo = 1;
    finished.value = false;
    fetchWalletTransactionHistory();
  };

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    loading.value = true;
    inputParams.value.pageNo++;
    fetchWalletTransactionHistory(true);
  };

  /** 事件或回调处理：onSelectAccount */
  const onSelectAccount = (action: PopoverAction) => {
    selectedAccount.value = action;
    inputParams.value.accountType = action.value;
    showAccountPopover.value = false;
  };

  /** 事件或回调处理：onSelectStatus */
  const onSelectStatus = (action: PopoverAction) => {
    selectedStatus.value = action;
    if (action.value !== null) {
      inputParams.value.status = action.value;
    } else {
      delete inputParams.value.status;
    }
    showStatusPopover.value = false;
    onRefresh();
  };

  /** 拉取接口数据：fetchWalletTransactionHistory */
  const fetchWalletTransactionHistory = (isLoadMore: boolean = false) => {
    getWalletTransactionHistory(inputParams.value).then((res) => {
      const { code } = res;
      if (Number(code) === 0) {
        const {
          data: { list }
        } = res;
        const newList = list.map((item: any) => {
          switch (item.hasConfirm) {
            case null:
            case 0:
              item.image = getTransactionTypeImage('pending');
              break;
            case 1:
              item.image = getTransactionTypeImage('success');
              break;
            case 2:
              item.image = getTransactionTypeImage('failed');
              break;
          }
          return item;
        });

        if (!isLoadMore) {
          TransactionHistoryList.value = newList;
        } else if (newList.length > 0) {
          TransactionHistoryList.value = [...TransactionHistoryList.value, ...newList];
        }

        if (newList.length < inputParams.value.pageSize) {
          finished.value = true;
        }

        setTimeout(() => {
          refreshing.value = false;
          loading.value = false;
        }, 500);
      }
    });
  };

  /** 拉取接口数据：fetchFundTypeList（POST /member/app/wallet/getFundTypeList） */
  const fetchFundTypeList = () => {
    getFundTypeList().then((res: any) => {
      if (Number(res?.code) !== 0) return;
      typeFilterOptions.value = res?.data || [];
    });
  };

  /** 拉取接口数据：fetchAccountOptions */
  const fetchAccountOptions = () => {
    getMyWalletInfo({}).then((res) => {
      if (Number(res?.code) !== 0) return;
      const list = res?.data?.balanceList || [];
      const values: string[] = Array.from(
        new Set(
          list
            .map((item: any) => item?.accountType)
            .filter((v: unknown) => v != null && String(v).trim() !== '')
            .map((v: unknown) => String(v))
        )
      );
      if (values.length < 1) return;

      accountOptions.value = values.map((name: string) => ({ text: name, value: name }));
      const routeAccount = String(routeType.value || '').trim();
      const matched = accountOptions.value.find((item) => String(item.value) === routeAccount);
      selectedAccount.value = matched || accountOptions.value[0];
    });
  };

  onBeforeMount((): void => {
    fetchAccountOptions();
    fetchFundTypeList();
    const { type } = route.query;
    if (type) {
      inputParams.value.accountType = type;
    }
    onRefresh();
  });
</script>

<style lang="less" scoped>
  .tx-history-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) { background: transparent !important; }
    :deep(.van-nav-bar__title) { font-size: 16px; font-weight: 600; color: #000; }
    :deep(.van-nav-bar .van-icon) { color: #000 !important; }
    :deep(.nav-back-button .van-icon) { color: #000 !important; }
    :deep(.page-wrap) { background: transparent; }
  }

  .tx-history-page__cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
    border: none !important;
  }

  .tx-filter-trigger {
    min-width: 2rem;
    max-width: 2.4rem;
    height: 0.65rem;
    padding: 0 0.2rem;
    border: 1px solid #e0e1fd;
    border-radius: 0.16rem;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.1rem;
    background: #f9faff !important;
  }

  :deep(.van-popover__content) {
    background: #fff !important;
    border: 1px solid #e0e1fd !important;
  }

  :deep(.van-popover__arrow) {
    border-bottom-color: #fff !important;
  }

  .tx-nav-filter {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0.8rem;
    min-height: 0.8rem;
    cursor: pointer;
  }

  .tx-filter-panel {
    padding: 0.32rem 0.3rem calc(0.32rem + env(safe-area-inset-bottom));
    background: #fff;
  }

  .tx-filter-section + .tx-filter-section {
    margin-top: 0.28rem;
  }

  .tx-filter-label {
    font-size: 0.28rem;
    color: #000;
    font-weight: 600;
    margin-bottom: 0.16rem;
  }

  .tx-filter-type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.16rem;
  }

  .tx-filter-type-item {
    min-height: 0.64rem;
    padding: 0.12rem 0.08rem;
    border-radius: 0.12rem;
    border: 1px solid #e0e1fd;
    background: #f9faff;
    color: #333;
    font-size: 0.24rem;
    line-height: 1.2;
  }

  .tx-filter-type-item--active {
    border-color: #2071f8;
    background: rgba(32, 113, 248, 0.08);
    color: #2071f8;
  }

  .tx-filter-date-row {
    display: flex;
    align-items: center;
    gap: 0.16rem;
  }

  .tx-filter-date-box {
    flex: 1;
    height: 0.72rem;
    border-radius: 0.12rem;
    border: 1px solid #e0e1fd;
    background: #f9faff;
    color: #333;
    font-size: 0.26rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tx-filter-date-to {
    color: #8c8c8c;
    font-size: 0.26rem;
    flex-shrink: 0;
  }

  .tx-filter-actions {
    display: flex;
    gap: 0.24rem;
    margin-top: 0.4rem;
  }

  .tx-filter-btn {
    flex: 1;
    height: 0.88rem;
    font-size: 0.3rem;
    font-weight: 700;
    border: none;
  }

  .tx-filter-btn--reset {
    color: #2071f8;
    background: transparent;
    border: 1px solid #2071f8;
  }

  .tx-filter-btn--confirm {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);
    border: none;
    color: #fff;
  }
</style>
