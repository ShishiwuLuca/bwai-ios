<template>
  <ConfigProvider theme="light">
    <PageWrap class="order-detail-page">
      <NavBar :title="t('od_title')" fixed placeholder :border="false" :ShowLeft="false">
        <template #left>
          <div class="order-detail-page__nav-back" @click="handleBack">
            <Icon name="arrow-left" :size="22" color="#000" />
          </div>
        </template>
      </NavBar>

    <div class="order-detail-page__content">
      <!-- 投资详情 -->
      <div class="order-detail-page__section-title">{{ t('od_invest_detail') }}</div>
      <div class="order-detail-page__card">
        <div class="order-detail-page__card-head">
          <span class="order-detail-page__card-tag">{{ detail?.productTypeName }}</span>
          <span
            class="order-detail-page__card-status"
            :class="`order-detail-page__card-status--${getOrderStatusClass(detail?.orderStatus)}`"
          >
            {{ getOrderStatusText(detail?.orderStatus) }}
          </span>
        </div>
        <div class="order-detail-page__card-split"></div>

        <div class="order-detail-page__card-row order-detail-page__card-row--title">
          <span class="order-detail-page__card-name">{{
            detail?.productName || t('od_project_default')
          }}</span>
          <span v-if="detail?.isValidUser === 0" class="order-detail-page__card-exp">{{
            t('od_tag_experience')
          }}</span>
        </div>

        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_period_day') }}</span>
          <span class="order-detail-page__value">{{ detail?.lockDay }}{{ t('od_day_unit') }}</span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_est_daily_rate') }}</span>
          <span class="order-detail-page__value">{{
            detail?.gainDayRateMinStr == detail?.gainDayRateMaxStr
              ? detail?.gainDayRateMinStr
              : detail?.gainDayRateMinStr + '-' + detail?.gainDayRateMaxStr
          }}</span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_invest_amount') }}</span>
          <span class="order-detail-page__value order-detail-page__value--accent">{{ detail?.buyAmount }} USDT</span>
        </div>
        <div
          class="order-detail-page__card-row"
          v-if="detail?.orderStatus == 3 || detail?.orderStatus == 4"
        >
          <span class="order-detail-page__label">{{ t('od_redemption_amount') }}</span>
          <span class="order-detail-page__value">{{ detail?.redemptionAmount }} USDT</span>
        </div>
        <div class="order-detail-page__card-row" v-if="detail?.orderStatus == 3">
          <span class="order-detail-page__label">{{ t('od_redemption_fee_label') }}</span>
          <span class="order-detail-page__value">{{ detail?.redemptionFee }} USDT</span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_total_profit') }}</span>
          <span class="order-detail-page__value order-detail-page__value--accent">{{ detail?.pendingGainAmount }} USDT</span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_claimable_profit') }}</span>
          <span class="order-detail-page__value order-detail-page__value--accent">{{ detail?.claimableGainAmount }} USDT</span>
        </div>
        <div
          class="order-detail-page__card-row"
          v-if="detail?.productReinvest === 1 && detail?.orderStatus != 3"
        >
          <span class="order-detail-page__label order-detail-page__label--accent">
            {{ t('od_smart_reinvest') }}
            <span class="order-detail-page__label-icon-wrap" @click.stop="onReinvestTip">
              <Icon name="question-o" class="order-detail-page__label-icon" />
            </span>
          </span>
          <span class="order-detail-page__value">
            <Switch
              :model-value="detail?.orderReinvest === 1"
              size="18"
              :disabled="reinvestLoading"
              @update:model-value="onReinvestChange"
            />
          </span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_invest_time') }}</span>
          <span class="order-detail-page__value">{{ detail?.buyTimeStr }}</span>
        </div>
        <div
          class="order-detail-page__card-row"
          v-if="detail?.orderStatus == 3 || detail?.orderStatus == 4"
        >
          <span class="order-detail-page__label">{{ t('od_redemption_time') }}</span>
          <span class="order-detail-page__value">{{ detail?.redemptionTimeStr }}</span>
        </div>
        <!-- <div class="order-detail-page__card-row">
                                                                <span class="order-detail-page__label"> 支付账户</span>
                                                                <span class="order-detail-page__value">{{ detail?.gainDay }}</span>
                                                              </div> -->
        <div class="order-detail-page__card-row order-detail-page__card-row--order">
          <span class="order-detail-page__label">{{ t('od_order_no') }}</span>
          <span class="order-detail-page__value order-detail-page__value--order">
            {{ detail?.orderNo }}
            <span
              class="order-detail-page__copy-wrap"
              @click.stop="copyToClipboard(detail?.orderNo)"
              :title="t('od_copy')"
            >
              <img :src="Copy" class="order-detail-page__copy-icon" :alt="t('od_copy')" />
            </span>
          </span>
        </div>

        <div class="order-detail-page__btn-row">
          <button
            v-if="detail?.orderStatus != 3 && detail?.orderStatus != 4"
            type="button"
            class="order-detail-page__btn order-detail-page__btn--ghost"
            @click="showRedeemPopup = true"
          >
            {{ t('od_apply_redeem') }}
          </button>
          <button
            v-if="detail?.orderStatus != 3 && detail?.orderStatus != 4"
            type="button"
            class="order-detail-page__btn order-detail-page__btn--primary"
            :disabled="claimLoading || (detail?.claimableGainAmount ?? 0) <= 0"
            @click="onClaim"
          >
            {{ claimLoading ? t('ab_toast_submitting') : t('od_claim_profit') }}
          </button>
        </div>
      </div>

      <!-- 申请赎回：温馨提示弹窗，确定调用 POST /stake/order/redeem -->
      <Popup
        :show="showRedeemPopup"
        position="center"
        :style="{ width: '85%', maxWidth: '6.3rem' }"
        class="order-detail-page__redeem-popup"
        @update:show="(v) => (showRedeemPopup = v)"
      >
        <div class="order-detail-page__redeem-shell">
          <button
            type="button"
            class="order-detail-page__redeem-close"
            aria-label="close"
            @click="showRedeemPopup = false"
          >
            <Icon name="cross" size="16" color="#fff" />
          </button>
          <div class="order-detail-page__redeem-dialog">
            <div class="order-detail-page__redeem-header">
              <span class="order-detail-page__redeem-title">{{ t('od_warm_tip') }}</span>
            </div>
          <p class="order-detail-page__redeem-tip">{{ t('od_redeem_tip') }}</p>
          <div class="order-detail-page__redeem-list">
            <div class="order-detail-page__redeem-item">
              <span class="order-detail-page__redeem-label">{{ t('od_order_total') }}</span>
              <span class="order-detail-page__redeem-num">{{ redeemOrderAmount }} USDT</span>
            </div>
            <div class="order-detail-page__redeem-item">
              <span class="order-detail-page__redeem-label">{{ t('od_redeem_fee') }}</span>
              <span class="order-detail-page__redeem-num">{{
                detail?.orderStatus == 2 ? 0 : redeemFeeText
              }}</span>
            </div>
            <div class="order-detail-page__redeem-item">
              <span class="order-detail-page__redeem-label">{{ t('od_principal_refund') }}</span>
              <span class="order-detail-page__redeem-num order-detail-page__redeem-num--blue"
                >{{ detail?.orderStatus == 2 ? redeemOrderAmount : redeemPrincipalText }} USDT</span
              >
            </div>
            <div class="order-detail-page__redeem-item">
              <span class="order-detail-page__redeem-label">{{ t('od_claimable_label') }}</span>
              <span class="order-detail-page__redeem-num">{{ redeemClaimableText }}</span>
            </div>
            <div class="order-detail-page__redeem-item">
              <span class="order-detail-page__redeem-label">{{ t('od_fee_free_time') }}</span>
              <span class="order-detail-page__redeem-num">{{ redeemFeeFreeTime }}</span>
            </div>
          </div>
          <div class="order-detail-page__redeem-actions">
            <button
              type="button"
              class="order-detail-page__redeem-btn order-detail-page__redeem-btn--cancel"
              @click="showRedeemPopup = false"
            >
              {{ t('od_cancel') }}
            </button>
            <button
              type="button"
              class="order-detail-page__redeem-btn order-detail-page__redeem-btn--confirm"
              :disabled="redeemLoading"
              @click="onConfirmRedeem"
            >
              {{ redeemLoading ? t('ab_toast_submitting') : t('od_confirm') }}
            </button>
          </div>
        </div>
        </div>
      </Popup>

      <!-- 交易所详情 -->
      <div class="order-detail-page__section-title">{{ t('od_exchange_detail') }}</div>
      <div class="order-detail-page__card">
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_exchange_platform') }}</span>
          <span class="order-detail-page__value">{{ exchangeAccount?.name || '-' }}</span>
        </div>
        <div class="order-detail-page__card-row order-detail-page__card-row--multi">
          <span class="order-detail-page__label">{{ t('od_exchange_website') }}</span>
          <span class="order-detail-page__value order-detail-page__value--copy">
            {{ exchangeAccount?.website || '-' }}
            <span
              class="order-detail-page__copy-wrap"
              @click.stop="copyToClipboard(exchangeAccount?.website)"
              :title="t('od_copy')"
            >
              <img :src="Copy" class="order-detail-page__copy-icon" :alt="t('od_copy')" />
            </span>
          </span>
        </div>
        <div class="order-detail-page__card-row order-detail-page__card-row--multi">
          <span class="order-detail-page__label">{{ t('od_exchange_account') }}</span>
          <span class="order-detail-page__value order-detail-page__value--copy">
            {{ exchangeAccount?.username }}
            <span
              class="order-detail-page__copy-wrap"
              @click.stop="copyToClipboard(exchangeAccount?.username)"
              :title="t('od_copy')"
            >
              <img :src="Copy" class="order-detail-page__copy-icon" :alt="t('od_copy')" />
            </span>
          </span>
        </div>

        <div class="order-detail-page__card-row order-detail-page__card-row--multi">
          <span class="order-detail-page__label">{{ t('od_exchange_password') }}</span>
          <span class="order-detail-page__value order-detail-page__value--copy">
            {{ exchangeAccount?.password }}
            <span
              class="order-detail-page__copy-wrap"
              @click.stop="copyToClipboard(exchangeAccount?.password)"
              :title="t('od_copy')"
            >
              <img :src="Copy" class="order-detail-page__copy-icon" :alt="t('od_copy')" />
            </span>
          </span>
        </div>
        <!-- USDT 去向：地址较多时一条一行展示，避免挤在同一行 -->
        <div class="order-detail-page__card-row order-detail-page__card-row--multi">
          <span class="order-detail-page__label">{{ t('od_usdt_dest') }}</span>
          <div class="order-detail-page__usdt-list">
            <span
              v-for="(item, i) in exchangeAccount?.addresses"
              :key="item.id ?? i"
              class="order-detail-page__value order-detail-page__value--copy order-detail-page__usdt-item"
            >
              {{ item.address }}
              <span
                class="order-detail-page__copy-wrap"
                @click.stop="copyToClipboard(item.address)"
                :title="t('od_copy')"
              >
                <img :src="Copy" class="order-detail-page__copy-icon" :alt="t('od_copy')" />
              </span>
            </span>
            <span v-if="!exchangeAccount?.addresses?.length" class="order-detail-page__value"
              >-</span
            >
          </div>
        </div>
      </div>

      <div class="order-detail-page__section-title">{{ t('od_profit_detail') }}</div>
      <div class="order-detail-page__income-wrap">
        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            v-model:loading="loading"
            :finished="finished"
            :finished-text="t('od_no_more')"
            @load="onLoad"
          >
            <div v-for="item in gainList" :key="item.id" class="order-detail-page__income-block">
              <div
                class="order-detail-page__income-head"
                :class="
                  item.receiveStatus === 1
                    ? 'order-detail-page__income-head--done'
                    : 'order-detail-page__income-head--pending'
                "
              >
                <span>{{ t('od_profit_status') }}</span>
                <span class="order-detail-page__income-status" :class="getProfitStatusClass(item)">
                  {{ getProfitStatusText(item) }}
                </span>
              </div>
              <div class="order-detail-page__card-row">
                <span class="order-detail-page__label">{{ t('od_release_amount') }}</span>
                <span class="order-detail-page__value order-detail-page__value--accent">{{ item.gainAmount }} USDT</span>
              </div>
              <div class="order-detail-page__card-row">
                <span class="order-detail-page__label">{{ t('od_invest_amount') }}</span>
                <span class="order-detail-page__value"
                  >{{
                    Number(item.reinvestAmount) > 0
                      ? item.buyAmount + ' + ' + item.reinvestAmount
                      : item.buyAmount || '-'
                  }}
                  USDT</span
                >
              </div>
              <div class="order-detail-page__card-row">
                <span class="order-detail-page__label">{{ t('od_gain_rate') }}</span>
                <span class="order-detail-page__value">{{ item.gainRateStr || '-' }}</span>
              </div>
              <!-- <div class="order-detail-page__card-row">
                                                                                                    <span class="order-detail-page__label">{{ t('od_reinvest_total') }}</span>
                                                                                                    <span class="order-detail-page__value">{{ item.reinvestAmount }} USDT</span>
                                                                                                  </div> -->

              <div class="order-detail-page__card-row">
                <span class="order-detail-page__label">{{ t('od_release_time') }}</span>
                <span class="order-detail-page__value">{{ item.gainTimeStr }}</span>
              </div>
              <div
                class="order-detail-page__card-row"
                v-if="
                  (detail?.orderStatus == 1 || detail?.orderStatus == 2) &&
                  detail?.orderReinvest == 0 &&
                  item.releaseStatus == 0 &&
                  item.freeTime > currentTime
                "
              >
                <span class="order-detail-page__label">{{ t('od_claimable_time') }}</span>
                <span class="order-detail-page__value">{{ item.freeTimeStr }}</span>
              </div>
            </div>
          </List>
        </PullRefresh>
      </div>
    </div>
  </PageWrap>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { Switch, PullRefresh, List, Popup, Icon, ConfigProvider } from 'vant';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import Copy from '/@/assets/images/AI/copy.png';
  import {
    getOrderDetail,
    orderReinvest,
    orderRedeem,
    orderClaim,

    /** AppOrderExchangeAccountVO：类型别名 */
    type AppOrderExchangeAccountVO
  } from '/@/service/Order';

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateSuccessToast, CreateErrorToast, CreateConfirmDialog } = useMessage();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 订单：getOrderStatusText */
  const getOrderStatusText = (status?: number) => {
    /** 常量或静态配置：map */
    const map: Record<number, string> = {
      1: t('od_status_running'),
      2: t('od_status_running'),
      3: t('od_status_done'),
      4: t('od_status_forced')
    };
    return map[status ?? 0] ?? t('od_status_ended');
  };

  /** 当前时间戳，用于判断可领取时间 */
  const currentTime = ref(Date.now());

  /** 订单：getOrderStatusClass */
  const getOrderStatusClass = (status?: number): string => {
    /** 常量或静态配置：map */
    const map: Record<number, string> = {
      1: 'running',
      2: 'running',
      3: 'done',
      4: 'forced'
    };
    return map[status ?? 0] ?? 'ended';
  };

  // ========== 订单详情（POST /stake/order/detail） ==========

  /** 响应式状态：详情 */
  const detail = ref<any | null>(null);

  /** exchangeAccount */
  const exchangeAccount = computed<AppOrderExchangeAccountVO | null>(
    () => detail.value?.exchangeAccount || null
  );

  // ========== 收益明细分页 ==========

  /** 响应式状态：列表数据 */
  const gainList = ref<any[]>([]);

  /** 响应式状态：分页 */
  const pageNo = ref(1);

  /** 分页：pageSize */
  const pageSize = 10;

  /** 响应式状态：总条数 */
  const total = ref(0);

  /** 给 van-list 用：上拉时组件会先把它设为 true，请求结束必须设回 false */
  const loading = ref(false);

  /** 是否正在请求接口（不能用 loading 判断：上拉时 List 已把 loading 设为 true，否则会误判直接 return，永远不结束加载） */
  const isFetching = ref(false);

  /** 响应式状态：下拉刷新 */
  const refreshing = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref(false);

  // ========== 操作 loading ==========

  /** 响应式状态：加载中状态 */
  const reinvestLoading = ref(false);

  /** 响应式状态：显隐控制 */
  const showRedeemPopup = ref(false);

  /** 响应式状态：加载中状态 */
  const redeemLoading = ref(false);

  /** 响应式状态：加载中状态 */
  const claimLoading = ref(false);

  // ========== 申请赎回弹窗展示数据 ==========

  /** 订单总金额 */
  const redeemOrderAmount = computed(() => detail.value?.buyAmount ?? 0);

  /** 赎回手续费%，后端无则默认 30% */
  const redeemFeeText = computed(() => {
    /** rate */
    const rate = (
      detail.value as {
        redemptionRate?: number;
      }
    )?.redemptionRate;
    return rate != null ? `${rate * 100}%` : '30%';
  });
  /** 退本到账金额 */
  const redeemPrincipalText = computed(() => {
    /** d */
    const d = detail.value;
    if (!d) return '0';

    /** buy */
    const buy = d.buyAmount ?? 0;

    /** rate */
    const rate =
      (
        d as {
          redemptionRate?: number;
        }
      ).redemptionRate ?? 0;
    return String(buy - buy * rate);
  });
  /** 可领取收益 + 时区 */
  const redeemClaimableText = computed(() => {
    /** d */
    const d = detail.value;

    /** 金额输入：amount */
    const amount = d?.claimableGainAmount ?? d?.pendingGainAmount ?? 0;
    return `${amount} USDT `;
  });
  /** 免手续费截止时间 */
  const redeemFeeFreeTime = computed(
    () =>
      (
        detail.value as {
          unlockTimeStr?: string;
        }
      )?.unlockTimeStr ?? '-'
  );
  const fetchDetail = (reset = false) => {
    if (isFetching.value) return;

    /** idParam */
    const idParam = route.query.id || route.query.orderId;

    /** 订单：orderId */
    const orderId = Number(idParam);
    if (!orderId) {
      CreateErrorToast(t('od_order_id_error'));
      loading.value = false;
      return;
    }
    if (reset) {
      pageNo.value = 1;
      finished.value = false;
    } else {
      pageNo.value += 1;
    }
    isFetching.value = true;
    loading.value = true;
    getOrderDetail({
      pageNo: pageNo.value,
      pageSize,
      orderId,
      offset: 0
    })
      .then((res) => {
        if (res.code === 0 && res.data) {
          if (pageNo.value === 1) {
            detail.value = res.data;
            gainList.value = res.data.gainDetailPage?.list || [];
          } else {
            const list = res.data.gainDetailPage?.list || [];
            gainList.value = gainList.value.concat(list);
          }
          total.value = res.data.gainDetailPage?.total ?? gainList.value.length;
          if (gainList.value.length >= total.value) {
            finished.value = true;
          }
        } else {
          CreateErrorToast(res.msg || t('od_fetch_fail'));
        }
      })
      .catch((e: unknown) => {
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('od_fetch_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        isFetching.value = false;
        loading.value = false;
        if (reset) {
          refreshing.value = false;
        }
      });
  };
  const onReinvestTip = () => {
    CreateConfirmDialog({
      title: t('ab_tip_title'),
      message: t('od_reinvest_tip'),
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel')
    }).catch(() => {});
  };
  const onReinvestChange = (checked: boolean) => {
    /** d */
    const d = detail.value;
    if (!d || d.orderId == null) return;
    if (reinvestLoading.value) return;

    /** next */
    const next = checked ? 1 : 0;

    /** prev */
    const prev = d.orderReinvest;
    d.orderReinvest = next;
    reinvestLoading.value = true;
    orderReinvest({ orderId: d.orderId, orderReinvest: next })
      .then((res) => {
        if (res?.code === 0) {
          CreateSuccessToast(next === 1 ? t('od_reinvest_on') : t('od_reinvest_off'));
          void fetchDetail(true);
        } else {
          d.orderReinvest = prev;
          CreateErrorToast(res?.msg || t('od_op_fail'));
        }
      })
      .catch((e: unknown) => {
        d.orderReinvest = prev;
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('od_op_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        reinvestLoading.value = false;
      });
  };
  const onConfirmRedeem = () => {
    /** d */
    const d = detail.value;
    if (!d?.orderId || redeemLoading.value) return;
    redeemLoading.value = true;
    orderRedeem({ orderId: d.orderId })
      .then((res) => {
        if (res?.code === 0) {
          showRedeemPopup.value = false;
          CreateSuccessToast(t('od_redeem_success'));
          void fetchDetail(true);
        } else {
          CreateErrorToast(res?.msg || t('od_redeem_fail'));
        }
      })
      .catch((e: unknown) => {
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('od_redeem_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        redeemLoading.value = false;
      });
  };
  const onClaim = () => {
    /** d */
    const d = detail.value;
    if (!d?.orderId || claimLoading.value) return;
    if (d.orderReinvest === 1) {
      CreateErrorToast(t('od_reinvest_no_claim'));
      return;
    }
    claimLoading.value = true;
    orderClaim({ orderId: d.orderId })
      .then((res) => {
        if (res?.code === 0) {
          CreateSuccessToast(t('od_claim_success'));
          void fetchDetail(true);
        } else {
          CreateErrorToast(res?.msg || t('od_claim_fail'));
        }
      })
      .catch((e: unknown) => {
        const msg =
          (
            e as {
              msg?: string;
            }
          )?.msg ?? t('od_claim_fail');
        CreateErrorToast(msg);
      })
      .finally(() => {
        claimLoading.value = false;
      });
  };
  const copyToClipboard = (text: string | undefined | null) => {
    /** str */
    const str =
      text != null && String(text).trim() !== '' && String(text) !== '-' ? String(text).trim() : '';
    if (!str) {
      CreateErrorToast(t('od_nothing_copy'));
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(str).then(
          () => {
            CreateSuccessToast(t('od_copy_success'));
          },
          () => {
            CreateErrorToast(t('od_copy_fail'));
          }
        );
        return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = str;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        CreateSuccessToast(t('od_copy_success'));
      } else {
        CreateErrorToast(t('od_copy_fail'));
      }
    } catch {
      CreateErrorToast(t('od_copy_fail'));
    }
  };
  const getProfitStatusText = (item: {
    releaseStatus?: number;
    receiveStatus?: number;
  }): string => {
    /** d */
    const d = detail.value;

    /** isReinvesting */
    const isReinvesting =
      (d?.orderStatus === 1 || d?.orderStatus === 2) &&
      d?.orderReinvest === 1 &&
      item?.releaseStatus === 0;
    if (isReinvesting) return t('od_reinvesting');
    return item?.receiveStatus === 1 ? t('od_claimed') : t('od_pending');
  };
  const getProfitStatusClass = (item: {
    releaseStatus?: number;
    receiveStatus?: number;
  }): string => {
    /** d */
    const d = detail.value;

    /** isReinvesting */
    const isReinvesting =
      (d?.orderStatus === 1 || d?.orderStatus === 2) &&
      d?.orderReinvest === 1 &&
      item?.releaseStatus === 0;
    if (isReinvesting) return 'order-detail-page__income-status--reinvesting';
    return item?.releaseStatus === 1
      ? 'order-detail-page__income-status--done'
      : 'order-detail-page__income-status--pending';
  };
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/MyOrder');
  };
  const onRefresh = () => {
    refreshing.value = true;
    void fetchDetail(true);
  };
  const onLoad = () => {
    if (finished.value) return;
    void fetchDetail(false);
  };
  onMounted(() => {
    void fetchDetail(true);
  });
</script>

<style scoped lang="less">
  @blue: #1a37fd;
  @text: #000;
  @label: #8c93a6;
  @value: #222;
  @white: #fff;
  @border: #e8ecf5;
  @shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @btn-gradient: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%);

  .order-detail-page {
    min-height: 100vh;
    padding-bottom: calc(0.32rem + env(safe-area-inset-bottom, 0px));
    color: @text;
  }

  .order-detail-page__content {
    padding: 0.24rem 0.32rem calc(0.48rem + env(safe-area-inset-bottom, 0px));
  }

  .order-detail-page__nav-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.8rem;
    height: 0.8rem;
    cursor: pointer;
  }

  .order-detail-page__section-title {
    margin: 0.2rem 0 0.16rem;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .order-detail-page__card {
    margin-bottom: 0.24rem;
    padding: 0.28rem 0.28rem 0.3rem;
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @shadow;
  }

  .order-detail-page__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem;
    margin-bottom: 0.14rem;
  }

  .order-detail-page__card-tag {
    font-size: 0.26rem;
    font-weight: 500;
    color: @blue;
    line-height: 1.3;
  }

  .order-detail-page__card-status {
    flex-shrink: 0;
    min-width: 1rem;
    padding: 0.06rem 0.14rem;
    border-radius: 0.08rem;
    font-size: 0.22rem;
    font-weight: 600;
    line-height: 1.3;
    text-align: center;

    &--running {
      color: @blue;
      background: #e8f0ff;
    }

    &--done {
      color: #2e9e5a;
      background: #e8f8ef;
    }

    &--forced {
      color: #e58a00;
      background: #fff4e5;
    }

    &--ended {
      color: @label;
      background: #f2f3f5;
    }
  }

  .order-detail-page__card-split {
    margin-bottom: 0.14rem;
    border-bottom: 1px dashed #dbe6ff;
  }

  .order-detail-page__card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.24rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid @border;

    &:last-of-type {
      border-bottom: none;
    }

    &--title {
      padding: 0.04rem 0 0.16rem;
      border-bottom: none;
    }

    &--order {
      align-items: flex-start;
    }

    &--multi {
      align-items: flex-start;
    }
  }

  .order-detail-page__card-name {
    font-size: 0.32rem;
    font-weight: 700;
    color: @text;
    line-height: 1.35;
  }

  .order-detail-page__card-exp {
    flex-shrink: 0;
    padding: 0.04rem 0.12rem;
    border-radius: 0.08rem;
    background: @blue;
    color: @white;
    font-size: 0.2rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .order-detail-page__label {
    flex-shrink: 0;
    font-size: 0.24rem;
    font-weight: 400;
    color: @label;
    line-height: 1.4;

    &--accent {
      display: inline-flex;
      align-items: center;
      gap: 0.06rem;
      font-size: 0.26rem;
      font-weight: 500;
      color: @blue;
    }
  }

  .order-detail-page__label-icon-wrap {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .order-detail-page__label-icon {
    font-size: 0.28rem;
    color: @blue;
  }

  .order-detail-page__value {
    text-align: right;
    font-size: 0.26rem;
    font-weight: 600;
    color: @value;
    line-height: 1.4;
    word-break: break-word;

    &--accent {
      color: @blue;
      font-weight: 700;
    }

    &--order {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.06rem;
      max-width: 68%;
    }

    &--copy {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.06rem;
      max-width: 68%;
    }

    :deep(.van-switch--on) {
      background: @blue;
    }
  }

  .order-detail-page__copy-wrap {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding: 0.04rem;
    cursor: pointer;
  }

  .order-detail-page__copy-icon {
    width: 0.28rem;
    height: 0.28rem;
    pointer-events: none;
  }

  .order-detail-page__usdt-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.12rem;
    min-width: 0;
  }

  .order-detail-page__usdt-item {
    display: inline-flex;
    align-items: flex-start;
    justify-content: flex-end;
    width: 100%;
    text-align: right;
    word-break: break-all;
  }

  .order-detail-page__btn-row {
    display: flex;
    gap: 0.2rem;
    margin-top: 0.24rem;
    padding-top: 0.08rem;
  }

  .order-detail-page__btn {
    flex: 1;
    height: 0.8rem;
    border-radius: 0.4rem;
    font-size: 0.3rem;
    font-weight: 700;
    cursor: pointer;

    &--ghost {
      border: 1px solid @blue;
      background: @white;
      color: @blue;
    }

    &--primary {
      border: none;
      background: @btn-gradient;
      color: @white;
      box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }

  /* 赎回弹窗 */
  .order-detail-page__redeem-popup :deep(.van-overlay) {
    background: rgba(0, 0, 0, 0.45);
  }

  .order-detail-page__redeem-popup :deep(.van-popup) {
    overflow: visible;
    background: transparent;
    box-shadow: none;
  }

  .order-detail-page__redeem-shell {
    position: relative;
    width: 100%;
  }

  .order-detail-page__redeem-close {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.64rem;
    height: 0.64rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: linear-gradient(145deg, @blue 0%, #4d8bff 52%, #8ed4ff 100%);
    box-shadow: 0 0.04rem 0.16rem rgba(26, 55, 253, 0.35);
    transform: translate(50%, -50%);
    cursor: pointer;
  }

  .order-detail-page__redeem-dialog {
    padding: 0.48rem 0.36rem 0.36rem;
    border-radius: 0.48rem;
    background: linear-gradient(145deg, #e2d3fc 0%, #fff 38%, #fff 72%, #c5edfd 100%);
    box-shadow: 0 0.16rem 0.48rem rgba(51, 102, 255, 0.18);
    color: @text;
  }

  .order-detail-page__redeem-header {
    margin-bottom: 0.16rem;
    text-align: center;
  }

  .order-detail-page__redeem-title {
    font-size: 0.36rem;
    font-weight: 700;
    color: @text;
  }

  .order-detail-page__redeem-tip {
    margin: 0 0 0.2rem;
    padding: 0 0.08rem;
    font-size: 0.26rem;
    line-height: 1.5;
    color: #666;
    text-align: center;
  }

  .order-detail-page__redeem-list {
    margin-bottom: 0.28rem;
    padding: 0.16rem 0.2rem;
    border-radius: 0.2rem;
    background: rgba(255, 255, 255, 0.72);
  }

  .order-detail-page__redeem-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.16rem;
    padding: 0.12rem 0;
    border-bottom: 1px solid rgba(232, 236, 245, 0.9);
    font-size: 0.26rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .order-detail-page__redeem-label {
    flex-shrink: 0;
    color: @label;
    font-weight: 400;
  }

  .order-detail-page__redeem-num {
    font-weight: 700;
    color: @value;
    text-align: right;
    word-break: break-all;

    &--blue {
      color: @blue;
    }
  }

  .order-detail-page__redeem-actions {
    display: flex;
    gap: 0.24rem;
    align-items: center;
  }

  .order-detail-page__redeem-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 0.88rem;
    border-radius: 0.44rem;
    font-size: 0.3rem;
    font-weight: 700;
    cursor: pointer;

    &--cancel {
      border: 1px solid @blue;
      background: @white;
      color: @blue;
    }

    &--confirm {
      border: none;
      background: @btn-gradient;
      color: @white;
      box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }

  /* 收益明细 */
  .order-detail-page__income-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.24rem;
  }

  .order-detail-page__income-block {
    padding: 0.28rem 0.28rem 0.24rem;
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @shadow;
    margin-bottom: 0.24rem;
  }

  .order-detail-page__income-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.08rem;
    font-size: 0.24rem;
    color: @label;
  }

  .order-detail-page__income-status {
    min-width: 1rem;
    padding: 0.04rem 0.14rem;
    border-radius: 0.08rem;
    font-size: 0.22rem;
    font-weight: 600;
    text-align: center;

    &--pending {
      color: #e58a00;
      background: #fff4e5;
    }

    &--reinvesting {
      color: @blue;
      background: #e8f0ff;
    }

    &--done {
      color: #2e9e5a;
      background: #e8f8ef;
    }
  }

  .order-detail-page__income-block .order-detail-page__card-row {
    padding: 0.16rem 0;
  }
</style>

<style lang="less">
  .order-detail-page__redeem-popup.van-popup {
    overflow: visible;
    background: transparent;
  }
</style>
