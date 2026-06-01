<template>
  <PageWrap class="order-detail-page">
    <NavBar :title="t('od_title')" fixed placeholder :border="false" :ShowLeft="false">
      <template #left>
        <div class="order-detail-page__nav-back" @click="handleBack">
          <Icon name="arrow-left" :size="22" />
        </div>
      </template>
    </NavBar>

    <div class="order-detail-page__content">
      <!-- 投资详情 -->
      <div class="order-detail-page__section-title">{{ t('od_invest_detail') }}</div>
      <AppCard class="order-detail-page__card">
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
          <span class="order-page__card-tag2">{{
            detail?.isValidUser === 0 ? t('od_tag_experience') : ''
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
          <span class="order-detail-page__value">{{ detail?.buyAmount }} USDT</span>
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
          <span class="order-detail-page__value">{{ detail?.pendingGainAmount }} USDT</span>
        </div>
        <div class="order-detail-page__card-row">
          <span class="order-detail-page__label">{{ t('od_claimable_profit') }}</span>
          <span class="order-detail-page__value">{{ detail?.claimableGainAmount }} USDT</span>
        </div>
        <div
          class="order-detail-page__card-row"
          v-if="detail?.productReinvest === 1 && detail?.orderStatus != 3"
        >
          <span class="order-detail-page__label"
            >{{ t('od_smart_reinvest') }}
            <span class="order-page__label-icon-wrap" @click.stop="onReinvestTip">
              <Icon name="question-o" class="order-page__label-icon" /> </span
          ></span>
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
          <Button
            class="order-detail-page__btn order-detail-page__btn--ghost"
            round
            @click="showRedeemPopup = true"
            v-if="detail?.orderStatus != 3 && detail?.orderStatus != 4"
          >
            {{ t('od_apply_redeem') }}
          </Button>
          <Button
            type="primary"
            class="order-detail-page__btn"
            round
            :loading="claimLoading"
            @click="onClaim"
            v-if="detail?.orderStatus != 3 && detail?.orderStatus != 4"
            :disabled="(detail?.claimableGainAmount ?? 0) <= 0"
          >
            {{ t('od_claim_profit') }}
          </Button>
        </div>
      </AppCard>

      <!-- 申请赎回：温馨提示弹窗，确定调用 POST /stake/order/redeem -->
      <Popup
        :show="showRedeemPopup"
        position="center"
        round
        :style="{ width: '85%' }"
        class="order-detail-page__redeem-popup modal"
        @update:show="(v) => (showRedeemPopup = v)"
      >
        <div class="order-detail-page__redeem-dialog">
          <div class="order-detail-page__redeem-header">
            <span class="order-detail-page__redeem-title">{{ t('od_warm_tip') }}</span>
            <div class="order-detail-page__redeem-close" @click="showRedeemPopup = false">
              <span class="order-detail-page__redeem-close-x">×</span>
            </div>
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
            <Button
              type="primary"
              block
              class="order-detail-page__redeem-btn order-detail-page__redeem-btn--confirm"
              round
              :loading="redeemLoading"
              @click="onConfirmRedeem"
            >
              {{ t('od_confirm') }}
            </Button>
          </div>
        </div>
      </Popup>

      <!-- 交易所详情 -->
      <div class="order-detail-page__section-title">{{ t('od_exchange_detail') }}</div>
      <AppCard class="order-detail-page__card">
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
      </AppCard>

      <!-- 收益明细：下拉刷新 + 上拉加载更多 -->
      <div class="order-detail-page__section-title">{{ t('od_profit_detail') }}</div>
      <AppCard class="shouyi">
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
                <span class="order-detail-page__value">{{ item.gainAmount }} USDT</span>
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
      </AppCard>
    </div>

    <!-- 底部 Tab：投资(跳 AIBuy) / 订单(当前) -->
    <!-- <Tabbar v-model="bottomTab" class="order-detail-page__bottom-tabbar">
            <TabbarItem name="invest" @click="goInvest">
              <template #icon>
                <img :src="AI1" alt="" class="ai-buy-page__tab-icon"
                  :class="{ 'ai-buy-page__tab-icon--active': bottomTab === 'invest' }" />
              </template>
              {{ t('od_tab_invest') }}
            </TabbarItem>
            <TabbarItem name="order" icon="notes-o">{{ t('od_tab_order') }}</TabbarItem>
          </Tabbar> -->
  </PageWrap>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { Button, Switch, PullRefresh, List, Popup, Icon } from 'vant';
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
  /* ---------- 页面与内容区 ---------- */
  .order-detail-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    color: var(--van-text-color);
  }

  .order-detail-page__content {
    padding: 0.32rem 0.32rem calc(1.4rem + env(safe-area-inset-bottom, 0px));
  }

  .order-detail-page__nav-back {
    width: 0.8rem;
    height: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .order-detail-page__section-title {
    margin: 0.18rem 0 0.16rem;
    font-size: 0.28rem;
    font-weight: 700;
  }

  /* ---------- 投资详情 / 交易所详情 卡片 ---------- */
  .order-detail-page__card {
    padding: 0.28rem 0.28rem 0.3rem;
    margin-bottom: 0.24rem;
  }

  .shouyi {
    background: transparent !important;
    border-radius: 0 !important;
  }

  .order-detail-page__card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.18rem;
    font-size: 0.24rem;
  }

  .order-detail-page__card-tag {
    color: rgba(255, 255, 255, 0.78);
  }

  .order-detail-page__card-status {
    min-width: 1.1rem;
    text-align: center;
    padding: 0.04rem 0.18rem;
    border-radius: 0.24rem;
    font-size: 0.22rem;
    font-weight: 600;
  }

  .order-detail-page__card-status--running {
    background: rgba(25, 137, 250, 0.18);
    color: #1989fa;
  }

  .order-detail-page__card-status--done {
    background: rgba(0, 160, 120, 0.18);
    color: #00c48c;
  }

  .order-detail-page__card-status--forced {
    background: rgba(255, 152, 0, 0.18);
    color: #ff9800;
  }

  .order-detail-page__card-status--ended {
    background: rgba(158, 158, 158, 0.18);
    color: #9e9e9e;
  }

  .order-detail-page__card-split {
    height: 0.02rem;
    margin-bottom: 0.2rem;
    border-bottom: 0.02rem dashed rgba(255, 255, 255, 0.18);
  }

  .order-detail-page__card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.24rem;
    padding: 0.06rem 0;
  }

  .order-detail-page__card-row--title {
    margin-bottom: 0.08rem;
  }

  .order-detail-page__card-name {
    font-size: 0.26rem;
    font-weight: 700;
  }

  .order-detail-page__card-tag2 {
    font-size: 0.22rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .order-detail-page__label {
    color: rgba(255, 255, 255, 0.72);
  }

  .order-detail-page__value {
    color: rgba(255, 255, 255, 0.96);
    font-weight: 600;
  }

  .order-detail-page__value--order {
    display: inline-flex;
    align-items: center;
    gap: 0.06rem;
  }

  /* 复制按钮：可点击区域，避免误触 */
  .order-detail-page__copy-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.08rem;
    padding: 0.06rem;
    cursor: pointer;
    vertical-align: middle;
  }

  .order-detail-page__copy-icon {
    width: 0.26rem;
    height: 0.26rem;
    color: rgba(255, 255, 255, 0.9);
    pointer-events: none;
  }

  .order-detail-page__card-row--multi .order-detail-page__value {
    max-width: 4.5rem;
    text-align: right;
  }

  .order-detail-page__usdt-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
    min-width: 0;
  }

  .order-detail-page__usdt-item {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    word-break: break-all;
    text-align: right;
  }

  .order-detail-page__btn-row {
    display: flex;
    justify-content: space-between;
    gap: 0.2rem;
    margin-top: 0.26rem;
  }

  .order-detail-page__btn {
    flex: 1;
    height: 0.88rem;
    font-size: 0.3rem;
    font-weight: 700;
  }

  .order-detail-page__btn--ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 0.9);
  }

  /* ---------- 申请赎回弹窗 ---------- */
  .order-detail-page__redeem-popup :deep(.van-overlay) {
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
  }

  .order-detail-page__redeem-popup :deep(.van-popup) {
    background: linear-gradient(180deg, #006ed2 0%, #012688 100%);
    border-radius: 0.32rem;
    overflow: hidden;
    box-shadow: 0 0.2rem 0.6rem rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .order-detail-page__redeem-dialog {
    padding: 0.44rem 0.36rem 0.36rem;
    color: #fff;
    min-width: 0;
  }

  .order-detail-page__redeem-header {
    position: relative;
    text-align: center;
    margin-bottom: 0.22rem;
    padding-right: 0.6rem;
  }

  .order-detail-page__redeem-title {
    font-size: 0.36rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .order-detail-page__redeem-close {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 0.56rem;
    height: 0.56rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 0.04rem 0.12rem rgba(0, 0, 0, 0.2);
  }

  .order-detail-page__redeem-close-x {
    font-size: 0.4rem;
    font-weight: 400;
    color: #1989fa;
    line-height: 1;
    margin-top: -0.04rem;
  }

  .order-detail-page__redeem-tip {
    font-size: 0.28rem;
    color: rgba(255, 255, 255, 0.92);
    margin: 0 0 0.28rem;
    line-height: 1.5;
    text-align: center;
    padding: 0 0.08rem;
  }

  .order-detail-page__redeem-list {
    margin-bottom: 0.36rem;
    padding: 0 0.04rem;
  }

  .order-detail-page__redeem-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.26rem;
    padding: 0.14rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .order-detail-page__redeem-item:last-child {
    border-bottom: none;
  }

  .order-detail-page__redeem-label {
    color: rgba(255, 255, 255, 0.72);
    font-weight: 400;
  }

  .order-detail-page__redeem-num {
    font-weight: 700;
    color: #fff;
    font-size: 0.27rem;
  }

  .order-detail-page__redeem-num--blue {
    color: #4a9eff;
    font-weight: 700;
  }

  .order-detail-page__redeem-actions {
    display: flex;
    gap: 0.24rem;
    align-items: center;
  }

  .order-detail-page__redeem-btn {
    flex: 1;
    height: 0.88rem;
    font-size: 0.3rem;
    font-weight: 600;
    border-radius: 0.44rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .order-detail-page__redeem-btn--cancel {
    background: #2a3250;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .order-detail-page__redeem-btn--confirm {
    background: linear-gradient(90deg, #3a8cff 0%, #1970e8 100%);
    color: #fff;
    border: none;
  }

  .order-detail-page__redeem-actions .van-button {
    flex: 1;
    height: 0.88rem !important;
    font-size: 0.3rem !important;
    font-weight: 600 !important;
    border-radius: 0.44rem !important;
  }

  .order-detail-page__redeem-actions .order-detail-page__redeem-btn--confirm {
    min-width: 0;
  }

  /* ---------- 收益明细列表 ---------- */
  .order-detail-page__income-block {
    margin-bottom: 0.24rem;
    border-radius: 0.2rem;
    padding: 0.28rem 0.28rem 0.3rem;
    background: var(--van-card-background);
  }

  .order-detail-page__income-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.24rem;
    margin-bottom: 0.08rem;
  }

  .order-detail-page__income-status {
    min-width: 1rem;
    text-align: center;
    padding: 0.02rem 0.16rem;
    border-radius: 0.24rem;
    font-size: 0.22rem;
    font-weight: 600;
  }

  .order-detail-page__income-status--pending {
    background: rgba(255, 187, 0, 0.18);
    color: #ffbb00;
  }

  .order-detail-page__income-status--reinvesting {
    background: rgba(0, 102, 255, 0.18);
    color: #0066ff;
  }

  .order-detail-page__income-status--done {
    background: rgba(0, 160, 120, 0.18);
    color: #00c48c;
  }

  /* ---------- 底部 TabBar（图标复用 ai-buy-page 类名） ---------- */
  .order-detail-page__bottom-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
  }

  .order-detail-page__bottom-tabbar :deep(.van-tabbar) {
    background: var(--van-tabbar-linear-background) !important;
    border-top: 1px solid var(--van-border-color, rgba(255, 255, 255, 0.06));
  }

  @media screen and (min-width: 600px) {
    .order-detail-page__bottom-tabbar {
      left: 50%;
      right: auto;
      width: 100%;
      max-width: 8rem;
      transform: translateX(-50%);
      bottom: 0;
    }

    .order-detail-page__bottom-tabbar :deep(.van-tabbar) {
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

  /* 投资 Tab 图标（与购买页共用类名，白底样式） */
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
</style>
