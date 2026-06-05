<template>
  <NavBar :title="t('str_transaction_history')" />
  <PageWrap>
    <div>
      <div v-if="showFilterBar" class="flex items-center justify-between gap-1 rounded-sm p-0.5">
        <div class="flex items-center gap-1">
          <div class="text-[0.28rem] text-white">{{ t('str_account') }}:</div>
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
          <div class="text-[0.28rem] text-white">类型:</div>
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
            :value="item.toBalance > item.fromBalance ? '+' + item.amount : '-' + item.amount"
            :label="getToDateTime(item.ctime).format('YYYY-MM-DD HH:mm:ss')"
            clickable
            center
            size="large"
            class="rounded-sm !pt-1 !pb-1 mb-1"
            :value-class="[
              '!font-bold !text-[0.35rem]',
              {
                '!text-[var(--van-down-color)]': item.toBalance > item.fromBalance,
                '!text-[var(--van-top-color)]': item.toBalance < item.fromBalance
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
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import type { PopoverAction } from 'vant';
  import { computed, ref, onBeforeMount } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { getToDateTime } from '/@/utils/TimeZone';
  import { getMyWalletInfo, getWalletTransactionHistory } from '/@/service/Wallet';
  import { PullRefresh, List, Empty, BackTop, Cell, Icon, Popover } from 'vant';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  // 路由类型

  /** 计算属性：由其它状态派生的展示或判断 */
  const routeType = computed(() => {
    const raw = route.query.type;
    if (Array.isArray(raw)) return raw[0];
    return raw;
  });

  // 是否显示筛选栏

  /** 响应式状态：显隐控制 */
  const showFilterBar = ref<boolean>(false);

  // 账户筛选弹窗

  /** 响应式状态：显隐控制 */
  const showAccountPopover = ref(false);

  // 状态筛选弹窗

  /** 响应式状态：显隐控制 */
  const showStatusPopover = ref(false);

  // 账户选项

  /** 响应式状态：accountOptions 相关 UI 或数据 */
  const accountOptions = ref<PopoverAction[]>([]);

  // 选中账户

  /** 响应式状态：selectedAccount 相关 UI 或数据 */
  const selectedAccount = ref<any>({});

  // 状态选项

  /** statusOptions */
  const statusOptions = computed<PopoverAction[]>(() => [
    { text: t('mc_status_all'), value: null },
    { text: t('mc_status_pending'), value: 0 },
    { text: t('mc_tab_passed'), value: 1 },
    { text: t('mc_tab_rejected'), value: 2 }
  ]);

  // 选中状态

  /** 响应式状态：selectedStatus 相关 UI 或数据 */
  const selectedStatus = ref<PopoverAction>({ text: t('mc_status_all'), value: '' });

  // 下拉刷新状态

  /** 响应式状态：下拉刷新 */
  const refreshing = ref<boolean>(false);

  // 上拉加载状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 是否已加载完所有数据

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref<boolean>(false);

  // 查询参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    pageNo: 1,
    pageSize: 10
    // accountType: ''
  });

  // 交易记录列表

  /** 响应式状态：列表数据 */
  const TransactionHistoryList = ref<any[]>([]);

  // 获取交易类型图片

  /** 事件或回调处理：getTransactionTypeImage */
  const getTransactionTypeImage = (type: string) => {
    return new URL(`../../assets/svg/${type}.svg`, import.meta.url).href;
  };

  // 下拉刷新事件

  /** 下拉刷新：onRefresh */
  const onRefresh = (): void => {
    inputParams.value.pageNo = 1;
    finished.value = false;
    fetchWalletTransactionHistory();
  };

  // 上拉加载更多事件

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    loading.value = true;
    inputParams.value.pageNo++;
    fetchWalletTransactionHistory(true);
  };

  // 选择账户事件

  /** 事件或回调处理：onSelectAccount */
  const onSelectAccount = (action: PopoverAction) => {
    selectedAccount.value = action;
    inputParams.value.accountType = action.value;
    showAccountPopover.value = false;
  };

  // 选择状态事件

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

  // 获取交易记录事件

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

  // 获取账户选项事件

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

  // 初始化事件
  onBeforeMount((): void => {
    fetchAccountOptions();
    const { type } = route.query;
    if (type) {
      inputParams.value.accountType = type;
    }
    onRefresh();
  });
</script>

<style lang="less" scoped>
  :deep(.van-cell) {
    background: var(--van-card-linear-background) !important;
    border: 1px solid var(--van-border-color) !important;
  }

  .tx-filter-bar {
    background: #0b1532;
  }

  .tx-filter-trigger {
    min-width: 2rem;
    max-width: 2.4rem;
    height: 0.65rem;
    padding: 0 0.2rem;
    border: 1px solid var(--van-border-color);
    border-radius: 0.16rem;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.1rem;
    background: var(--van-card-background) !important;
  }

  :deep(.van-popover__content) {
    background: var(--van-card-background) !important;
    border: 1px solid var(--van-border-color) !important;
  }

  :deep(.van-popover__arrow) {
    border-bottom-color: var(--van-card-background) !important;
  }
</style>
