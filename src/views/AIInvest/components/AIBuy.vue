<template>
  <PageWrap class="ai-buy-page">
    <NavBar :title="t('ab_title')" fixed placeholder :border="false" :ShowLeft="false">
      <template #left>
        <div class="ai-buy-page__nav-back" @click="goBackToInvest">
          <Icon name="arrow-left" :size="22" />
        </div>
      </template>
    </NavBar>

    <div class="ai-buy-page__content">
      <!-- 顶部 Banner：图 + 英文标题 -->
      <AppCardLinear class="ai-buy-page__banner">
        <div class="ai-buy-page__banner-inner">
          <img
            :src="rawProduct?.appLogo ? rawProduct.appLogo : Mask"
            alt=""
            class="ai-buy-page__banner-img"
          />
        </div>
      </AppCardLinear>

      <div class="ai-buy-page__section-title">{{ t('ab_section_ai') }}</div>

      <!-- 账户选择 + 数量输入 + 全部填充，可用余额来自 /stake/balance -->
      <AppCard class="ai-buy-page__card ai-buy-page__card--form">
        <div class="ai-buy-page__form-row">
          <div class="ai-buy-page__account" @click="showAccountPicker = true">
            <span class="ai-buy-page__account-text">{{ accountLabel }}</span>
            <Icon name="arrow-down" class="ai-buy-page__account-arrow" />
          </div>

          <span class="ai-buy-page__amount-divider" aria-hidden="true"></span>

          <input
            v-model="amount"
            class="ai-buy-page__amount"
            inputmode="decimal"
            autocomplete="off"
            :placeholder="t('ab_placeholder_amount')"
          />

          <button type="button" class="ai-buy-page__all" @click="fillAll">{{ t('ab_all') }}</button>
        </div>

        <div class="ai-buy-page__available">
          <span class="ai-buy-page__available-text">
            <span class="ai-buy-page__available-label">{{ t('ab_available') }}</span>
            <span class="ai-buy-page__available-value">{{ available }}</span>
            <span class="ai-buy-page__available-unit">{{ currency }}</span>
          </span>
        </div>
      </AppCard>

      <!-- Tab：投资详情 / 投资限制（仅 rawProduct.condition 不为 null 时显示） -->
      <div
        v-if="rawProduct?.condition != null && rawProduct?.condition?.status == 1"
        class="ai-buy-page__detail-tabs"
      >
        <div
          v-for="tab in detailTabs"
          :key="tab.value"
          class="ai-buy-page__detail-tab"
          :class="{ 'ai-buy-page__detail-tab--active': activeDetailTab === tab.value }"
          @click="activeDetailTab = tab.value"
        >
          {{ t(tab.labelKey) }}
        </div>
      </div>

      <!-- 投资详情：来自路由 query.product 解析后的产品信息 -->
      <div
        v-show="rawProduct?.condition == null || activeDetailTab === 'detail'"
        class="ai-buy-page__detail"
      >
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_project') }}</span>
          <span class="ai-buy-page__detail-val">{{ rawProduct?.name }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_period') }}</span>
          <span class="ai-buy-page__detail-val">{{ investPeriod }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_amount') }}</span>
          <span class="ai-buy-page__detail-val"
            >{{ investAmountRange }} {{ rawProduct?.gainCoin }}</span
          >
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_tag') }}</span>
          <span class="ai-buy-page__detail-val">{{ investTag }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_rate') }}</span>
          <span class="ai-buy-page__detail-val">{{ investRate }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_coin') }}</span>
          <span class="ai-buy-page__detail-val">{{ rawProduct?.gainCoin }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_cycle') }}</span>
          <span class="ai-buy-page__detail-val">{{
            rawProduct?.gainCycleType === 0
              ? rawProduct?.gainCycleValue + ' ' + t('ab_day_unit')
              : rawProduct?.gainCycleValue + ' ' + t('ab_hour_unit')
          }}</span>
        </div>
        <div class="ai-buy-page__detail-row">
          <span class="ai-buy-page__detail-key">{{ t('ab_detail_reinvest') }}</span>
          <span class="ai-buy-page__detail-val"
            >{{ rawProduct?.isReinvest === 1 ? t('ab_yes') : t('ab_no') }}
          </span>
        </div>
      </div>

      <!-- 投资限制（仅 rawProduct.condition 不为 null 时显示） -->
      <div
        v-if="
          rawProduct?.condition != null &&
          activeDetailTab === 'limit' &&
          rawProduct?.condition?.status == 1
        "
        class="ai-buy-page__limit"
      >
        <div class="ai-buy-page__limit-row">
          <span class="ai-buy-page__limit-key">{{ t('ab_limit_projects') }}</span>
          <div class="ai-buy-page__limit-scroll">
            <span class="ai-buy-page__limit-scroll-text">{{ limitProjectsText }}</span>
          </div>
        </div>
        <div class="ai-buy-page__limit-row">
          <span class="ai-buy-page__limit-key">{{ t('ab_limit_staking') }}</span>
          <span class="ai-buy-page__limit-val">
            <span
              class="ai-buy-page__limit-val--current"
              :class="
                limitStakingBelowRequired
                  ? 'ai-buy-page__limit-val--current--low'
                  : 'ai-buy-page__limit-val--current--met'
              "
              >{{ limitStakingCurrent }}</span
            >
            <span> / {{ limitStakingRequired }} {{ currency }}</span>
          </span>
        </div>
      </div>

      <!-- 结算延迟说明 -->
      <AppCard class="ai-buy-page__card ai-buy-page__tip">
        <div class="ai-buy-page__tip-title">{{ t('ab_tip_title') }}</div>
        <div class="ai-buy-page__tip-text">{{ t('ab_tip_text') }}</div>
        <div class="ai-buy-page__tip-text">{{ t('ab_tip_text_2') }}</div>
      </AppCard>
    </div>

    <!-- 确定：提交投资，调用 POST /stake/product/invest -->
    <div class="ai-buy-page__footer">
      <Button
        type="primary"
        block
        round
        class="ai-buy-page__btn"
        @click="onSubmit"
        :disabled="!productCanBuy"
        >{{ productCanBuy ? t('ab_join_now') : t('ab_invest_unavailable') }}</Button
      >
    </div>

    <!-- 底部 Tab：投资(当前) / 订单(跳转我的订单) -->
    <Tabbar v-model="bottomTab" class="ai-buy-page__bottom-tabbar">
      <TabbarItem name="invest">
        <template #icon>
          <img
            :src="AI1"
            alt=""
            class="ai-buy-page__tab-icon"
            :class="{ 'ai-buy-page__tab-icon--active': bottomTab === 'invest' }"
          />
        </template>
        <span>{{ t('ab_tab_invest') }}</span>
      </TabbarItem>
      <TabbarItem name="order" icon="notes-o" @click="goOrder">{{ t('ab_tab_order') }}</TabbarItem>
    </Tabbar>

    <!-- 账户选择弹窗：AI 账户 / LP 账户 -->
    <Popup
      :show="showAccountPicker"
      class="modal !w-full"
      position="bottom"
      round
      @update:show="(v) => (showAccountPicker = v)"
    >
      <div class="ai-buy-page__popup">
        <div class="ai-buy-page__popup-title">{{ t('ab_select_account') }}</div>
        <div class="ai-buy-page__popup-list">
          <button
            v-for="item in accounts"
            :key="item.value"
            type="button"
            class="ai-buy-page__popup-item"
            @click="selectAccount(item)"
          >
            {{ t(item.labelKey) }}
          </button>
        </div>
      </div>
    </Popup>
  </PageWrap>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard, AppCardLinear } from '/@/components';
  import { Button, Icon, Popup, Tabbar, TabbarItem } from 'vant';
  import Mask from '/@/assets/images/AI/Mask1.png';
  import AI1 from '/@/assets/images/AI/touzi.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getStakeBalance, type AppBalanceRespVO } from '/@/service/Balance';
  import { productInvest, type AppProductRespVO } from '/@/service/Product';
  import { getStakeOverview } from '/@/service/Overview';

  /** 当前页路由：读取 query.product、写入 session 产品缓存 */
  const route = useRoute();

  /** 提交成功后跳转我的订单、返回 AI 投资列表 */
  const router = useRouter();

  /** 申购页全部展示文案 */
  const { t } = useI18n();

  /** Toast：成功 / 错误 / 提交中 Loading */
  const { CreateSuccessToast, CreateErrorToast, CreateLoadingToast } = useMessage();

  /** sessionStorage 中缓存上次选中产品的 key，用于无 query 时兜底 */
  const PRODUCT_CACHE_KEY = 'ai-buy:last-product';

  /** 本页展示与申购币种（与接口约定一致） */
  const currency = 'USDT';

  // ========== 产品信息（来自路由 query.product） ==========

  /** 当前申购产品：来自路由或 session 反序列化 */
  const rawProduct = ref<AppProductRespVO | null>(null);

  // ========== 余额与表单 ==========

  /** AI / LP 账户可用余额等，来自 getStakeBalance */
  const balanceData = ref<AppBalanceRespVO | null>(null);

  /** 用户输入的申购数量 */
  const amount = ref('');

  /** 防止重复提交 productInvest */
  const submitting = ref(false);

  /** 账户切换选项：AI 账户 / LP 现货账户 */
  const accounts = [
    { labelKey: 'ab_account_ai', value: 'ai' },
    { labelKey: 'ab_account_lp', value: 'spot' }
  ] as const;

  /** 当前选中的扣款账户 */
  const account = ref<(typeof accounts)[number]>(accounts[0]);

  /** 底部账户选择弹层显隐 */
  const showAccountPicker = ref(false);

  /** 底部 Tab：当前在「投资」流程；可切到「订单」 */
  const bottomTab = ref<'invest' | 'order'>('invest');

  // Tab：投资详情 / 投资限制

  /** 投资详情 / 投资限制 两个子 Tab 的配置 */
  const detailTabs = [
    { labelKey: 'ab_detail_title', value: 'detail' },
    { labelKey: 'ab_limit_title', value: 'limit' }
  ] as const;

  /** 详情区当前子 Tab：产品说明 / 条件限制 */
  const activeDetailTab = ref<'detail' | 'limit'>('detail');

  /** 全局质押量概览，用于投资限制区展示进度 */
  const overviewStakingAmount = ref(0);

  // 投资限制展示

  /** 条件限制里「可参与产品」名称列表，多行拼接展示 */
  const limitProjectsText = computed(() => {
    const list = rawProduct.value?.condition?.products;
    if (!Array.isArray(list) || list.length === 0) return '';
    return list
      .map((x) => String(x?.productName ?? '').trim())
      .filter(Boolean)
      .join('\n');
  });

  /** 条件限制要求的最低质押金额（USDT） */
  const limitStakingRequired = computed(() => rawProduct.value?.condition?.conditionAmount ?? 1000);

  /** 当前用户已质押金额（接口 processAmount） */
  const limitStakingCurrent = computed(() =>
    String(rawProduct.value?.condition?.processAmount ?? 0)
  );

  /** 当前质押是否仍低于要求：低于为红，达到/超过为蓝 */
  const limitStakingBelowRequired = computed(() => {
    const cur = Number(limitStakingCurrent.value);
    const req = Number(limitStakingRequired.value);
    if (!Number.isFinite(cur) || !Number.isFinite(req)) return true;
    return cur < req;
  });

  // ========== 投资详情展示（基于 rawProduct） ==========

  /** 锁仓周期展示：有 lockDay 则带单位，否则默认文案 */
  const investPeriod = computed(() =>
    rawProduct.value?.lockDay != null
      ? `${rawProduct.value.lockDay} ${t('ab_day_unit')}`
      : t('ab_default_period')
  );

  /** 可申购金额区间：最小–最大或单侧展示 */
  const investAmountRange = computed(() => {
    const p = rawProduct.value;
    if (!p) return t('ab_default_range');
    if (p.buyAmountMin != null && p.buyAmountMax != null) {
      return `${p.buyAmountMin}-${p.buyAmountMax}`;
    }
    if (p.buyAmountMin != null) return String(p.buyAmountMin);
    return t('ab_default_range');
  });

  /** 产品标签名 */
  const investTag = computed(() => rawProduct.value?.tagName);

  /** 日化收益率区间或单值展示 */
  const investRate = computed(() =>
    rawProduct.value?.gainDayRateMinStr == rawProduct.value?.gainDayRateMaxStr
      ? rawProduct.value?.gainDayRateMinStr
      : rawProduct.value?.gainDayRateMinStr + '-' + rawProduct.value?.gainDayRateMaxStr
  );

  /** 是否可申购：与列表页 canBuy 一致，为 1 时可提交 */
  const productCanBuy = computed(() => Number(rawProduct.value?.canBuy) === 1);

  /** 账户选择器展示文案（i18n key） */
  const accountLabel = computed(() => t(account.value.labelKey));

  /** 当前选中账户可用余额：AI 取 ai.availableBalance，LP 取 lp.availableBalance */
  const available = computed(() => {
    const data = balanceData.value;
    if (!data) return '0';
    const item = account.value.value === 'ai' ? data.ai : data.lp;
    const num = item?.availableBalance;
    if (num == null || Number.isNaN(num)) return '0';
    return String(num);
  });

  // ========== 生命周期 ==========
  /** 挂载时：优先从路由恢复产品，其次 session；并拉余额与质押概览 */
  onMounted(() => {
    // 1) 优先读取路由参数（从 AIInvest 点击“确定”进入时会带上 product）
    const raw = Array.isArray(route.query.product) ? route.query.product[0] : route.query.product;
    if (typeof raw === 'string' && raw) {
      try {
        const fromQuery = JSON.parse(decodeURIComponent(raw)) as AppProductRespVO;
        rawProduct.value = fromQuery;
        // 2) 同步缓存一份，便于“非传参入口”再次进入时兜底展示
        window.sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(fromQuery));
      } catch {
        rawProduct.value = null;
      }
    } else {
      // 3) 无路由参数时，回退到本地缓存
      try {
        const cached = window.sessionStorage.getItem(PRODUCT_CACHE_KEY);
        rawProduct.value = cached ? (JSON.parse(cached) as AppProductRespVO) : null;
      } catch {
        rawProduct.value = null;
      }
    }
    void fetchBalance();
    void fetchOverview();
  });

  /** 拉取全局质押量，写入 overviewStakingAmount */
  const fetchOverview = () => {
    getStakeOverview()
      .then((res) => {
        if (res?.data?.stakingAmount != null) {
          overviewStakingAmount.value = Number(res.data.stakingAmount) || 0;
        }
      })
      .catch(() => {
        overviewStakingAmount.value = 0;
      });
  };

  /** 拉取 AI/LP 可用余额，写入 balanceData */
  const fetchBalance = () => {
    getStakeBalance()
      .then((res) => {
        if (res?.code === 0 && res.data) {
          balanceData.value = res.data;
        }
      })
      .catch(() => {
        balanceData.value = null;
      });
  };

  /** 将输入框填为当前账户全部可用余额 */
  const fillAll = () => {
    amount.value = available.value;
  };

  /** 切换账户并关闭弹层 */
  const selectAccount = (item: (typeof accounts)[number]) => {
    account.value = item;
    console.log(account.value);
    showAccountPicker.value = false;
  };

  /** 校验金额与产品后调用 productInvest，成功跳转我的订单 */
  const onSubmit = () => {
    const value = (amount.value || '').trim();
    if (!value) {
      CreateErrorToast(t('ab_toast_enter_amount'));
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) {
      CreateErrorToast(t('ab_toast_valid_amount'));
      return;
    }
    const product = rawProduct.value;
    if (!product?.id) {
      CreateErrorToast(t('ab_toast_product_error'));
      return;
    }
    if (Number(product.canBuy) !== 1) {
      CreateErrorToast(t('ab_invest_unavailable'));
      return;
    }
    if (submitting.value) return;
    submitting.value = true;
    const toast = CreateLoadingToast(t('ab_toast_submitting'));
    const accountType = account.value.value === 'ai' ? 0 : 1;
    productInvest({
      accountType,
      productId: product.id,
      amount: num
    })
      .then((res) => {
        toast.close();
        if (res && res.code !== 0) {
          CreateErrorToast(res.msg || t('ab_toast_invest_fail'));
          return;
        }
        CreateSuccessToast(t('ab_toast_invest_success'));
        amount.value = '';
        router.push('/MyOrder');
      })
      .catch((e: unknown) => {
        toast.close();
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('ab_toast_invest_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        submitting.value = false;
      });
  };

  /** 底部 Tab：进入我的订单页 */
  const goOrder = () => {
    router.push('/MyOrder');
  };

  /** 导航栏返回：回到 AI 投资列表 */
  const goBackToInvest = () => {
    router.push('/AIInvest');
  };
</script>

<style scoped lang="less">
  /* ---------- 页面与内容区 ---------- */
  .ai-buy-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px) + 1.2rem);
    color: var(--van-text-color);
  }

  .ai-buy-page__content {
    padding: 0.32rem 0.32rem calc(2.4rem + env(safe-area-inset-bottom, 0px));
  }

  .ai-buy-page__nav-back {
    width: 0.8rem;
    height: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* ---------- Banner ---------- */
  .ai-buy-page__banner {
    padding: 0;
    margin-bottom: 0.24rem;
    overflow: hidden;
  }

  .ai-buy-page__banner-inner {
    position: relative;
  }

  .ai-buy-page__banner-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .ai-buy-page__banner-text {
    position: absolute;
    left: 0.32rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }

  .ai-buy-page__banner-title {
    font-size: 0.42rem;
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: 0.01rem;
    color: #ffffff;
  }

  .ai-buy-page__section-title {
    font-size: 0.3rem;
    font-weight: 700;
    margin: 0.18rem 0 0.18rem;
  }

  .ai-buy-page__section-title--detail {
    margin-top: 0.26rem;
    color: rgba(25, 137, 250, 0.95);
  }

  /* Tab：投资详情 / 投资限制 */
  .ai-buy-page__detail-tabs {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.26rem;
    margin-bottom: 0.18rem;
    border-bottom: 1px solid rgba(38, 68, 134, 0.28);
  }

  .ai-buy-page__detail-tab {
    position: relative;
    padding-bottom: 0.16rem;
    font-size: 0.28rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    transition: color 0.2s;
  }

  .ai-buy-page__detail-tab--active {
    color: rgba(255, 255, 255, 0.95);
  }

  .ai-buy-page__detail-tab--active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: #fff;
    border-radius: 1px;
  }

  /* 投资限制 */
  .ai-buy-page__limit {
    padding: 0.08rem 0.06rem 0.02rem;
  }

  .ai-buy-page__limit-row {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0.16rem;
    padding: 0.18rem 0;
    font-size: 0.26rem;
    border-bottom: 1px solid rgba(38, 68, 134, 0.22);
  }

  .ai-buy-page__limit-row:last-child {
    border-bottom: none;
  }

  .ai-buy-page__limit-key {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.78);
  }

  /* 项目名：右侧多行罗列，过长时可纵向滚动 */
  .ai-buy-page__limit-scroll {
    flex: 1;
    min-width: 0;
    max-height: 2.4rem;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    text-align: right;
  }

  .ai-buy-page__limit-scroll::-webkit-scrollbar {
    width: 0.06rem;
  }

  .ai-buy-page__limit-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25);
    border-radius: 0.04rem;
  }

  .ai-buy-page__limit-scroll-text {
    display: block;
    white-space: pre-line;
    text-align: right;
    color: #ffffff;
    font-weight: 700;
    line-height: 1.45;
    word-break: break-word;
  }

  .ai-buy-page__limit-val {
    flex: 1;
    min-width: 0;
    text-align: right;
    color: rgba(255, 255, 255, 0.92);
    font-weight: 700;
  }

  .ai-buy-page__limit-val--current {
    font-weight: 700;
  }

  .ai-buy-page__limit-val--current--low {
    color: #f56c6c;
  }

  .ai-buy-page__limit-val--current--met {
    color: #74bcff;
  }

  .ai-buy-page__card--form {
    background: transparent;
  }

  /* ---------- 账户 + 数量输入 + 可用余额 ---------- */
  .ai-buy-page__form-row {
    display: grid;
    grid-template-columns: 1.55rem 0.08rem 1fr 0.86rem;
    align-items: center;
    gap: 0.1rem;
    height: 1.05rem;
    padding: 0 0.28rem;
    border-radius: 0.1rem;
    background: rgba(255, 255, 255, 0.04);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  .ai-buy-page__account {
    display: flex;
    align-items: center;
    gap: 0.14rem;
    font-size: 0.25rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.92);
  }

  .ai-buy-page__account-arrow {
    font-size: 0.25rem;
    opacity: 0.9;
    transform: translateY(0.02rem);
  }

  /* 竖条分隔（渐变蓝） */
  .ai-buy-page__amount-divider {
    display: block;
    width: 0.08rem;
    height: 0.56rem;
    border-radius: 0.04rem;
    background: linear-gradient(
      180deg,
      rgba(120, 228, 255, 0.98) 0%,
      rgba(45, 166, 255, 0.98) 45%,
      rgba(25, 137, 250, 0.98) 100%
    );
    box-shadow:
      0 0 0.24rem rgba(45, 166, 255, 0.48),
      0 0 0.08rem rgba(120, 228, 255, 0.32);
    pointer-events: none;
  }

  .ai-buy-page__amount {
    width: 100%;
    height: 0.8rem;
    border: none;
    outline: none;
    background: transparent !important;
    box-shadow: none !important;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.25rem;
    font-weight: 700;
    padding: 0 0.26rem 0 0.18rem;
    -webkit-appearance: none;
    appearance: none;
  }

  .ai-buy-page__amount::placeholder {
    color: rgba(255, 255, 255, 0.45);
    font-weight: 700;
  }

  .ai-buy-page__amount:-webkit-autofill,
  .ai-buy-page__amount:-webkit-autofill:hover,
  .ai-buy-page__amount:-webkit-autofill:focus {
    -webkit-text-fill-color: rgba(255, 255, 255, 0.9);
    transition: background-color 9999s ease-in-out 0s;
    box-shadow: 0 0 0 1000px transparent inset !important;
  }

  .ai-buy-page__all {
    border: none;
    background: transparent;
    font-size: 0.25rem;
    font-weight: 800;
    color: rgba(45, 166, 255, 0.95);
    text-align: right;
    padding: 0;
  }

  .ai-buy-page__available {
    margin-top: 0.12rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.12rem;
  }

  .ai-buy-page__available-text {
    font-size: 0.25rem;
    color: rgba(255, 255, 255, 0.65);
    font-weight: 600;
    display: inline-flex;
    align-items: baseline;
    gap: 0.12rem;
  }

  .ai-buy-page__available-value {
    color: rgba(45, 166, 255, 0.95);
    font-weight: 900;
    letter-spacing: 0.01rem;
  }

  .ai-buy-page__available-unit {
    color: rgba(255, 255, 255, 0.72);
    font-weight: 800;
  }

  .ai-buy-page__available-plus {
    width: 0.44rem;
    height: 0.44rem;
    border-radius: 50%;
    border: 1px solid rgba(25, 137, 250, 0.45);
    background: radial-gradient(circle at 30% 30%, rgba(45, 166, 255, 0.12), rgba(9, 13, 32, 0.12));
    color: rgba(45, 166, 255, 0.95);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.34rem;
    line-height: 0.44rem;
    font-weight: 900;
    padding: 0;
    box-shadow: 0 0.06rem 0.16rem rgba(25, 137, 250, 0.18);
  }

  /* ---------- 投资详情列表 ---------- */
  .ai-buy-page__detail {
    padding: 0.08rem 0.06rem 0.02rem;
  }

  .ai-buy-page__detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.18rem 0;
    font-size: 0.26rem;
    border-bottom: 1px solid rgba(38, 68, 134, 0.22);
  }

  .ai-buy-page__detail-row:last-child {
    border-bottom: none;
  }

  .ai-buy-page__detail-key {
    color: rgba(255, 255, 255, 0.78);
  }

  .ai-buy-page__detail-val {
    color: rgba(255, 255, 255, 0.92);
    font-weight: 700;
  }

  .ai-buy-page__tip {
    margin-top: 0.22rem;
    padding: 0.22rem 0.24rem;
    background: rgba(23, 29, 58, 0.75);
    border: 1px solid rgba(38, 68, 134, 0.28);
  }

  .ai-buy-page__tip-title {
    font-size: 0.26rem;
    font-weight: 700;
    margin-bottom: 0.12rem;
  }

  .ai-buy-page__tip-text {
    font-size: 0.22rem;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.7);
  }

  /* ---------- 底部按钮与 TabBar ---------- */
  .ai-buy-page__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    padding: 0.18rem 0.32rem 0.22rem;
    background: linear-gradient(
      180deg,
      rgba(9, 13, 32, 0),
      rgba(9, 13, 32, 0.9) 30%,
      rgba(9, 13, 32, 1)
    );
    z-index: 10;
  }

  .ai-buy-page__btn {
    height: 0.92rem;
    font-size: 0.34rem;
    font-weight: 700;
  }

  .ai-buy-page__bottom-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
  }

  .ai-buy-page__bottom-tabbar :deep(.van-tabbar) {
    background: var(--van-tabbar-linear-background) !important;
    border-top: 1px solid var(--van-border-color, rgba(255, 255, 255, 0.06));
  }

  @media screen and (min-width: 600px) {
    .ai-buy-page__footer {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
      bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    }

    .ai-buy-page__bottom-tabbar {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
      bottom: 0;
    }

    .ai-buy-page__bottom-tabbar :deep(.van-tabbar) {
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 100% !important;
      max-width: 8rem !important;
      bottom: 0 !important;
      top: auto !important;
      max-height: none !important;
      overflow: hidden !important;
    }
  }

  .ai-buy-page__tab-icon {
    width: 0.46rem;
    height: 0.46rem;
    display: block;
    filter: grayscale(1) opacity(0.6);
    transition:
      filter 0.2s ease,
      opacity 0.2s ease;
  }

  .ai-buy-page__tab-icon--active {
    filter: none;
    opacity: 1;
  }

  .ai-buy-page__popup {
    padding: 0.24rem 0.24rem 0.32rem;
    background: var(--van-background);
  }

  .ai-buy-page__popup-title {
    font-size: 0.28rem;
    font-weight: 700;
    margin-bottom: 0.18rem;
  }

  .ai-buy-page__popup-list {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .ai-buy-page__popup-item {
    width: 100%;
    height: 0.88rem;
    border-radius: 0.2rem;
    border: 1px solid rgba(38, 68, 134, 0.35);
    background: rgba(23, 29, 58, 0.7);
    color: var(--van-text-color);
    font-size: 0.28rem;
    font-weight: 600;
  }

  /* 覆盖 AppCard 圆角（与设计一致） */
  .ai-buy-page :deep(.app-card) {
    border-radius: 0 !important;
  }
</style>
