<template>
  <div class="task-page-shell">
    <!-- 先拉 enable-status，请求结束前只显示加载 -->
    <div v-if="activationGateLoading" class="task-page__gate-loading">
      <Loading type="spinner" vertical>{{ t('dt_loading') }}</Loading>
    </div>
    <!-- 门控结束后始终渲染正文；未激活时另叠一层说明弹窗 -->
    <PageWrap v-else class="task-page">
      <NavBar :title="t('dt_title')" left-arrow fixed placeholder :border="false">
        <template #right>
          <span class="task-page__nav-right" @click="handleShowRule">{{ t('dt_rule') }}</span>
        </template>
      </NavBar>

      <div class="task-page__content">
        <div class="task-page__banner">
          <Image :src="taskBanner" class="task-page__banner-img" fit="cover" />
        </div>

        <AppCard class="task-page__sign-card mt-[-3rem]">
          <div class="task-page__sign-head">
            <div class="task-page__sign-tab-under">{{ t('dt_daily_wage') }}</div>
            <div class="task-page__sign-head-cover"></div>
            <div class="task-page__sign-days">{{ t('dt_claim_days', [continueClaimDays]) }}</div>
          </div>

          <div class="task-page__sign-list">
            <template v-if="signListLoading">
              <div
                v-for="n in SIGN_SKELETON_INDICES"
                :key="'sign-sk-' + n"
                class="task-page__sign-skeleton-item"
                :style="{ '--sk-delay': `${(n - 1) * 0.08}s` }"
              >
                <div class="task-page__sign-skeleton-icon"></div>
                <div
                  class="task-page__sign-skeleton-line task-page__sign-skeleton-line--main"
                ></div>
                <div class="task-page__sign-skeleton-line task-page__sign-skeleton-line--sub"></div>
              </div>
            </template>
            <template v-else>
              <div
                v-for="item in signItems"
                :key="item.key"
                class="task-page__sign-item"
                :class="[
                  `task-page__sign-item--${item.status}`,
                  { 'task-page__sign-item--is-today': item.isToday }
                ]"
                @click="item.click && showWagePopupClick(item)"
              >
                <div
                  class="task-page__sign-icon"
                  :class="{ 'task-page__sign-icon--claimed': item.status === 'claimed' }"
                >
                  <span>{{ item.icon }}</span>
                </div>
                <div class="task-page__sign-main">{{ item.text }}</div>
                <div class="task-page__sign-sub">{{ item.date }}</div>
              </div>
            </template>
          </div>
          <Button
            type="primary"
            round
            block
            class="task-page__sign-btn"
            @click="GoClaimWage"
            :disabled="claimDisabled"
            >{{ t('dt_claim_wage') }}</Button
          >
          <p class="task-page__tip">{{ t('dt_tip') }}</p>
        </AppCard>
        <div class="task-page__income-detail" @click="router.push('/SalaryDetail')">{{
          t('dt_salary_detail')
        }}</div>
        <AppCard class="task-page__income-card">
          <div class="task-page__income-grid">
            <div class="task-page__income-cell">
              <div class="task-page__income-label">{{ t('dt_total_earned') }}</div>
              <div class="task-page__income-value">
                <CountTo
                  :startVal="0"
                  :decimals="4"
                  :endVal="Number(dailyWageSummary?.totalEarned)"
                />
              </div>
            </div>
            <div class="task-page__income-cell">
              <div class="task-page__income-label">{{ t('dt_claimable') }}</div>
              <div class="task-page__income-value">
                <CountTo
                  :startVal="0"
                  :decimals="4"
                  :endVal="Number(dailyWageSummary?.claimableAmount)"
                />
              </div>
            </div>
          </div>
        </AppCard>

        <div class="task-page__today">
          <div class="task-page__today-title">{{ t('dt_today_task') }}</div>
          <div class="task-page__progress" :style="progressGridVars">
            <div class="task-page__progress-top">
              <span class="task-page__progress-pin-wrap">
                <Icon name="location-o" class="task-page__progress-pin" />
              </span>
              <span
                v-for="(reward, i) in progressRewards"
                :key="`reward-${i}`"
                class="task-page__progress-reward-label"
                >+{{ reward }}</span
              >
            </div>
            <div class="task-page__progress-line">
              <div
                class="task-page__progress-line-fill"
                :style="{ width: `${progressRate}%` }"
              ></div>
            </div>
            <div class="task-page__progress-points">
              <span
                v-for="(point, pi) in progressPoints"
                :key="`point-${pi}`"
                class="task-page__progress-point-item"
              >
                <i class="task-page__progress-coin"></i>
                {{ point }}
              </span>
            </div>
          </div>
        </div>

        <AppCard class="task-page__task-center">
          <div class="task-page__task-center-head">
            <div class="task-page__task-center-tab-under">{{ t('dt_task_center') }}</div>
            <div class="task-page__task-center-head-cover"></div>
            <!-- <div class="task-page__task-center-text">{{ t('dt_task_center_desc') }}</div> -->
          </div>

          <div
            v-for="(item, i) in sortedTaskConfigList"
            :key="item.id ?? i"
            class="task-page__task-row"
            @click="showSignPopupClick(item)"
          >
            <div class="task-page__task-left">
              <div class="task-page__task-icon">
                <Icon :name="item.icon" />
              </div>
              <div class="task-page__task-info">
                <div class="task-page__task-name">
                  <span class="task-page__task-name-text">{{ item.title }}</span>
                  <span class="task-page__task-reward">
                    <i class="task-page__task-reward-coin"></i>+{{ item.points }}
                  </span>
                </div>
                <div class="task-page__task-desc">{{ t('dt_task_desc', [item.title]) }}</div>
              </div>
            </div>
            <Button
              size="small"
              type="primary"
              class="task-page__task-btn"
              :disabled="taskRowBtnDisabled(item)"
            >
              {{ taskRowBtnText(item) }}
            </Button>
          </div>
        </AppCard>
      </div>

      <!-- 玩法说明弹窗：与 Rank 页活动说明保持同款 UI -->
      <img
        :src="closeIcon"
        alt=""
        class="task-page__rule-close"
        @click="handleHideRule"
        v-show="showRule"
      />
      <img :src="rankMascot" alt="" class="task-page__rule-mascot" v-show="showRule" />
      <Popup
        v-model:show="showRule"
        round
        position="center"
        class="task-page__rule-popup"
        overlay-class="task-page__rule-overlay"
      >
        <div class="task-page__rule-card">
          <div class="task-page__rule-inner">
            <div class="task-page__rule-tab">
              <img :src="rankTabBg" alt="" class="task-page__rule-tab-bg" />
              <span class="task-page__rule-tab-text">{{ t('dt_rule_title') }}</span>
            </div>

            <div class="task-page__rule-section task-page__rule-section--first">
              <p v-if="ruleLoading">{{ t('dt_loading') }}</p>
              <p v-else class="task-page__rule-desc"><span v-html="ruleDescription"></span></p>
            </div>

            <Button
              type="primary"
              round
              block
              class="task-page__rule-confirm"
              @click="handleHideRule"
            >
              {{ t('confirm') }}
            </Button>
          </div>
        </div>
      </Popup>

      <!-- 任务弹窗：分享平台按设计图布局 -->
      <Popup
        v-model:show="showSignPopupQiandao"
        round
        position="bottom"
        class="task-page__sign-popup modal !w-full"
        overlay-class="task-page__sign-popup-overlay"
      >
        <div
          class="task-page__sign-popup-card"
          :class="{ 'task-page__sign-popup-card--share': isSharePlatformTask }"
        >
          <div class="task-page__sign-popup-close" @click.stop="handleCloseTaskPopup">
            <Icon name="cross" />
          </div>

          <div class="task-page__sign-popup-title">{{ currentTaskConfig?.title }}</div>

          <!-- 分享平台：副标题 + 平台选择 -->
          <template v-if="isSharePlatformTask">
            <div class="task-page__sign-popup-hint">{{ t('dt_share_platform_hint') }}</div>
            <div class="task-page__sign-platform-row">
              <div
                v-for="p in sharePlatformList"
                :key="p.key"
                class="task-page__sign-platform-item"
                :class="{ 'task-page__sign-platform-item--active': selectedPlatform === p.key }"
                @click="selectedPlatform = p.key"
              >
                <div
                  class="task-page__sign-platform-icon"
                  :class="`task-page__sign-platform-icon--${p.key}`"
                >
                  <img v-if="p.icon" :src="p.icon" :alt="p.label" />
                  <span v-else class="task-page__sign-platform-emoji">{{ p.emoji }}</span>
                </div>
                <span class="task-page__sign-platform-label">{{ p.label }}</span>
              </div>
            </div>
          </template>

          <div class="task-page__sign-popup-block">
            <div class="task-page__sign-popup-subtitle">{{
              isSharePlatformTask ? t('dt_share_requirement') : t('dt_task_requirement')
            }}</div>
            <div class="task-page__sign-popup-text">{{ currentTaskConfig?.description }}</div>
          </div>

          <div class="task-page__sign-popup-block" v-if="taskProgressLabel">
            <div class="task-page__sign-popup-subtitle">{{ taskProgressLabel }}</div>
            <div class="task-page__sign-popup-text">{{ taskProgressValue }}</div>
          </div>

          <div class="task-page__sign-popup-block">
            <div class="task-page__sign-popup-subtitle">{{ t('dt_task_reward') }}</div>
            <div class="task-page__sign-popup-text"
              ><span class="task-page__sign-popup-star">★</span>{{ currentTaskConfig?.points }}</div
            >
          </div>

          <div
            class="task-page__sign-popup-block"
            v-if="currentTaskConfig?.extConfigJson?.uploadRequired === true"
          >
            <div class="task-page__sign-popup-subtitle">{{ t('dt_upload_proof') }}</div>
            <Uploader
              v-model="taskUploadFiles"
              class="task-page__sign-popup-upload"
              accept="image/*"
              :max-count="5"
              multiple
              :after-read="handleTaskUpload"
            >
              <div class="task-page__sign-popup-upload-trigger">
                <Icon name="photograph" size="28" />
                <span>{{ t('dt_click_upload') }}</span>
              </div>
            </Uploader>
          </div>

          <Button
            type="primary"
            round
            block
            class="task-page__sign-popup-btn"
            :disabled="popupBtnDisabled"
            @click="submitTaskClick(currentTaskConfig)"
            >{{ popupBtnText }}</Button
          >
        </div>
      </Popup>
      <!-- 领取工资弹窗：点击「领取工资」触发，样式与设计图一致 -->
      <img
        :src="closeIcon"
        alt=""
        class="task-page__wage-popup-close"
        @click="showWagePopup = false"
        v-show="showWagePopup"
      />
      <Popup
        v-model:show="showWagePopup"
        round
        position="center"
        class="task-page__wage-popup modal !w-full"
        overlay-class="task-page__wage-popup-overlay"
      >
        <div class="task-page__wage-popup-card">
          <div class="task-page__wage-popup-title">{{ t('dt_claim_wage') }}</div>
          <div class="task-page__wage-popup-subtitle">{{ wagePopupSubtitle }}</div>

          <div class="task-page__progress" :style="progressGridVars">
            <div class="task-page__progress-top">
              <span class="task-page__progress-pin-wrap">
                <Icon name="location-o" class="task-page__progress-pin" />
              </span>
              <span
                v-for="(reward, i) in progressRewards"
                :key="`wage-reward-${i}`"
                class="task-page__progress-reward-label"
                >+{{ reward }}</span
              >
            </div>
            <div class="task-page__progress-line">
              <div
                class="task-page__progress-line-fill"
                :style="{ width: `${wagePopupProgressWidth}%` }"
              ></div>
            </div>
            <div class="task-page__progress-points">
              <span
                v-for="(point, pi) in progressPoints"
                :key="`wage-point-${pi}`"
                class="task-page__progress-point-item"
              >
                <i class="task-page__progress-coin"></i>
                {{ point }}
              </span>
            </div>
          </div>
          <Button
            type="primary"
            round
            block
            class="task-page__wage-popup-btn"
            @click="handleClaimWage"
            :disabled="wageRecordStatus !== 1"
            >{{ t('dt_claim_now') }}</Button
          >
        </div>
      </Popup>
    </PageWrap>

    <!-- data.activated=false：与玩法说明弹窗同款壳（Popup / 遮罩 / 角标 / 主按钮） -->
    <img
      :src="closeIcon"
      alt=""
      class="task-page__rule-close"
      @click="closeNotActivatedModal"
      v-show="showNotActivatedModal"
    />
    <img :src="rankMascot" alt="" class="task-page__rule-mascot" v-show="showNotActivatedModal" />
    <Popup
      v-model:show="showNotActivatedModal"
      round
      position="center"
      :close-on-click-overlay="false"
      class="task-page__rule-popup"
      overlay-class="task-page__rule-overlay"
    >
      <div class="task-page__rule-card">
        <div class="task-page__rule-inner">
          <div class="task-page__rule-tab">
            <img :src="rankTabBg" alt="" class="task-page__rule-tab-bg" />
            <span class="task-page__rule-tab-text">{{ t('dt_activation_title') }}</span>
          </div>

          <div class="task-page__rule-section task-page__rule-section--first">
            <p class="task-page__not-activated-intro">{{ t('dt_activation_intro') }}</p>
            <div class="task-page__not-activated-block task-page__not-activated-block--projects">
              <span class="task-page__not-activated-key">{{
                t('dt_activation_projects_label')
              }}</span>
              <div class="task-page__not-activated-val-list">
                <div
                  v-for="(name, i) in activationProductNamesList"
                  :key="'proj-' + i"
                  class="task-page__not-activated-val-line"
                >
                  {{ name }}
                </div>
              </div>
            </div>
            <div class="task-page__not-activated-row">
              <span class="task-page__not-activated-key">{{ activationAmountLabel }}</span>
              <span class="task-page__not-activated-val">{{ activationAmountValue }}</span>
            </div>
          </div>

          <Button
            type="primary"
            round
            block
            class="task-page__rule-confirm"
            @click="closeNotActivatedModal"
          >
            {{ t('tp_close') }}
          </Button>
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup lang="ts">
  import { ref, shallowRef, computed, onMounted, onBeforeMount } from 'vue';
  import { NavBar, PageWrap, AppCard, CountTo } from '/@/components';
  import { Button, Image, Icon, Popup, Uploader, Loading } from 'vant';
  import { useRouter } from 'vue-router';
  import taskBanner from '/@/assets/images/Task/taskBanner.png';
  import rankMascot from '/@/assets/images/Rank/rank1.png';
  import rankTabBg from '/@/assets/images/Rank/Vector 4.png';
  import closeIcon from '/@/assets/images/Rank/close.png';
  import tiktokIcon from '/@/assets/images/Task/Tiktok.png';
  import youtubeIcon from '/@/assets/images/Task/Youtube.png';
  import XIcon from '/@/assets/images/Task/X.png';
  import telegramIcon from '/@/assets/images/Task/Telegram.png';
  import {
    getTaskDesc,
    getWageStatusList,
    getDailyWageSummary,
    getDailyWageSettingList,
    getTaskConfigList,
    claimWage,
    submitTask,
    getWageRecordByDate,
    isActiveDailyTask,
    claimDailyWage,

    /** AppActTaskWageRuleVO：类型别名 */
    type AppActTaskWageRuleVO,

    /** AppDailyTaskEnableStatusVO：类型别名 */
    type AppDailyTaskEnableStatusVO
  } from '/@/service/Task';
  import { uploadFile } from '/@/service/System';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  // --- 常量 ---

  /** 常量或静态配置：PLATFORM_ICONS */
  const PLATFORM_ICONS: Record<string, string> = {
    tiktok: tiktokIcon,
    youtube: youtubeIcon,
    telegram: telegramIcon,
    x: XIcon,
    X: XIcon
  };

  /** 常量或静态配置：DEFAULT_PLATFORMS */
  const DEFAULT_PLATFORMS = [
    { key: 'tiktok', label: 'Tik Tok', emoji: '♪' },
    { key: 'youtube', label: 'YouTube', emoji: '▶' },
    { key: 'telegram', label: 'Telegram', emoji: '✈' }
  ];

  /** 常量或静态配置：PROGRESS_TASK_TYPES */
  const PROGRESS_TASK_TYPES = [
    'DIRECT_INVEST',
    'ACCUMULATED_RECHARGE',
    'DIRECT_ACCUMULATED_RECHARGE'
  ];

  /** 常量或静态配置：AUDIT_BTN_MAP */
  const AUDIT_BTN_MAP: Record<number, string> = {
    0: 'dt_submit_task',
    1: 'dt_auditing',
    2: 'dt_completed',
    3: 'dt_resubmit'
  };

  /** 常量或静态配置：FALLBACK_PROGRESS_REWARDS */
  const FALLBACK_PROGRESS_REWARDS = [1, 2, 5, 10];

  /** 常量或静态配置：FALLBACK_PROGRESS_POINTS */
  const FALLBACK_PROGRESS_POINTS = [0, 70, 90, 100, 150];

  /** 与签到网格列数一致，骨架屏用 */
  const SIGN_GRID_COLUMNS = 7;

  /** SIGN_SKELETON_INDICES */
  const SIGN_SKELETON_INDICES = Array.from({ length: SIGN_GRID_COLUMNS }, (_, i) => i + 1);

  /** 任务图标：模块级 glob，避免每次 fetchTaskConfigList 重复扫描 */
  const TASK_ICON_MODULES = import.meta.glob<string>('../../assets/images/Task/*.png', {
    eager: true,
    query: '?url',
    import: 'default'
  });

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 是否在请求 enable-status（首屏门控） */
  const activationGateLoading = ref(true);

  /** 响应式状态：显隐控制 */
  const showNotActivatedModal = ref(false);

  /** enable-status 返回体，用于弹窗里产品名与金额条件 */
  const enableStatusData = ref<AppDailyTaskEnableStatusVO | null>(null);

  /** 弹窗：产品名列表（一项一行；无数据则一行占位「—」） */
  const activationProductNamesList = computed((): string[] => {
    /** raw */
    const raw = enableStatusData.value?.productNames;
    if (!Array.isArray(raw) || raw.length === 0) return ['—'];

    /** 列表数据：list */
    const list = raw.map((n) => String(n ?? '').trim()).filter(Boolean);
    return list.length ? list : ['—'];
  });

  /** 弹窗第二行左侧：需满足 + limitTypeText */
  const activationAmountLabel = computed(() => {
    /** d */
    const d = enableStatusData.value;
    if (!d) return '';

    /** label */
    const label = String(d.limitTypeText ?? '').trim() || t('dt_activation_invest_default');
    return t('dt_activation_satisfy_label', [label]);
  });

  /** 弹窗第二行右侧：当前/限额 USDT */
  const activationAmountValue = computed(() => {
    /** d */
    const d = enableStatusData.value;
    if (!d) return '';

    /** cur */
    const cur = Number(d.currentAmount ?? 0);

    /** lim */
    const lim = Number(d.limitAmount ?? 0);
    return `${cur} / ${lim} USDT`;
  });
  const closeNotActivatedModal = () => {
    showNotActivatedModal.value = false;
    router.back();
  };
  const resolveTaskIconUrl = (activityType: string): string => {
    /** keys */
    const keys = Object.keys(TASK_ICON_MODULES);

    /** match */
    const match = keys.find((k) => k.endsWith(`/${activityType}.png`));
    if (match) return TASK_ICON_MODULES[match];

    /** custom */
    const custom = keys.find((k) => k.endsWith('/CUSTOM.png'));
    return custom ? TASK_ICON_MODULES[custom] : '';
  };
  const TASK_ROW_BTN_I18N: Record<number, string> = {
    0: 'dt_go_complete',
    1: 'dt_auditing',
    2: 'dt_completed',
    3: 'dt_go_complete'
  };
  const isAuditLocked = (auditStatus: unknown) => {
    /** a */
    const a = Number(auditStatus ?? 0);
    return a === 1 || a === 2;
  };
  const taskRowBtnText = (item: any) => {
    /** 键名或缓存键：key */
    const key = TASK_ROW_BTN_I18N[Number(item?.auditStatus ?? 0)];
    return key != null ? t(key) : '';
  };
  const taskRowBtnDisabled = (item: any) => {
    return isAuditLocked(item?.auditStatus);
  };
  /** 任务中心列表排序：去完成(0/3) > 审核中(1) > 已完成(2) > 其它 */
  const AUDIT_STATUS_SORT: Record<number, number> = { 0: 0, 3: 0, 1: 1, 2: 2 };
  const taskCenterAuditSortWeight = (auditStatus: unknown): number => {
    return AUDIT_STATUS_SORT[Number(auditStatus ?? 0)] ?? 3;
  };
  const sortedTaskConfigList = computed(() => {
    return [...taskConfigList.value].sort((x, y) => {
      const w =
        taskCenterAuditSortWeight(x?.auditStatus) - taskCenterAuditSortWeight(y?.auditStatus);
      if (w !== 0) return w;
      const ix = Number(x?.id ?? 0);
      const iy = Number(y?.id ?? 0);
      if (Number.isFinite(ix) && Number.isFinite(iy) && ix !== iy) return ix - iy;
      return 0;
    });
  });
  const UserStore = useUserStoreWithOut();
  const {
    CreateErrorToast,
    CreateSuccessToast,
    CreateConfirmDialog,
    CreateLoadingToast,
    CreateCloseToast
  } = useMessage();
  // --- 状态 ---
  const progressRewards = ref<number[]>([...FALLBACK_PROGRESS_REWARDS]);
  const progressPoints = ref<number[]>([...FALLBACK_PROGRESS_POINTS]);
  const progressRate = ref(0);
  const progressRateValue = ref(0);
  const showRule = ref(false);
  const showSignPopupQiandao = ref(false);
  const taskUploadFiles = ref<any[]>([]);
  const showWagePopup = ref(false);
  const ruleLoading = ref(false);
  const ruleDescription = ref('');
  const signItems = shallowRef<SignItem[]>([]);
  /** 签到行首屏/无数据重新拉取时的占位，有数据后刷新不再闪骨架 */
  const signListLoading = ref(true);
  const dailyWageSummary = ref<any>({});
  const continueClaimDays = ref(0);
  const taskConfigList = ref<any[]>([]);
  const currentTaskConfig = ref<any>({});
  const selectedPlatform = ref('');
  const currentWageDate = ref<any>({});
  const wageRecordStatus = ref(0);
  type SignItem = {
    key: string;
    text: string;
    date: string;
    bizDate: string | number[];
    status: string;
    icon: string;
    click: boolean;
    claimStatus?: number;
    /** 是否为当日格子：今日统一深蓝渐变 + 金边，与是否待领取无关 */
    isToday?: boolean;
  };
  // --- 工具函数 ---
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const refreshAllData = () => {
    void fetchWageStatus();
    void fetchDailyWageSummary();
    void fetchDailyWageSettingList();
    void fetchTaskConfigList();
  };
  /** 与上行一致：首列 auto（图钉/0），其余列与奖励数相同宽，避免下行 7 等分与上行错位 */
  const progressGridVars = computed(() => ({
    '--progress-reward-cols': String(Math.max(1, progressRewards.value.length))
  }));
  const wagePopupProgressWidth = computed(() => Math.min(progressRateValue.value, 100));
  const wagePopupSubtitle = computed(() => {
    /** bd */
    const bd = currentWageDate.value;
    if (bd == null) return '';
    if (typeof bd === 'object' && !Array.isArray(bd) && Object.keys(bd as object).length === 0) {
      return '';
    }
    if (!normalizeBizDate(bd)) return '';
    return `${formatSignDate(bd)}${t('dt_activity_suffix')}`;
  });
  const handleClaimWage = () => {
    showWagePopup.value = false;
    claimDailyWage({ bizDate: currentWageDate.value }).then((res) => {
      if (res?.code === 0) {
        CreateSuccessToast(t('dt_claim_success'));
        refreshAllData();
      } else {
        CreateErrorToast(res?.msg || t('dt_claim_fail'));
      }
    });
  };
  const getTodayStr = () => {
    /** d */
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const normalizeBizDate = (bizDate: string | number[] | unknown): string => {
    if (typeof bizDate === 'string') return bizDate;
    if (Array.isArray(bizDate) && bizDate.length >= 3) {
      const [y, m, d] = bizDate;
      return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
    }
    return String(bizDate ?? '');
  };
  const formatSignDate = (bizDate: string | number[] | unknown, todayStr?: string) => {
    /** str */
    const str = normalizeBizDate(bizDate);

    /** today */
    const today = todayStr ?? getTodayStr();
    if (str === today) return t('dt_sign_today');

    /** parts */
    const parts = str.split('-');
    if (parts.length >= 3) return `${parts[1]}-${parts[2]}`;
    return str;
  };
  const pickSignIcon = (isToday: boolean, claimStatus: number) => {
    if (isToday) return '★';
    if (Number(claimStatus) === 1) return '★';
    return '✓';
  };
  const getSignCfg = () => {
    return {
      4: { text: t('dt_sign_claimed'), icon: '✓', click: true },
      1: { text: t('dt_pending_claim'), icon: '★', click: true },
      0: { text: t('dt_ended'), icon: '✓', click: true },
      2: { text: t('dt_ended'), icon: '✓', click: true }
    } as Record<
      number,
      {
        text: string;
        icon: string;
        click: boolean;
      }
    >;
  };
  const claimDisabled = ref<boolean>(true);
  const mapWageListToSignItems = (rawList: any[], today: string): SignItem[] => {
    /** signCfg */
    const signCfg = getSignCfg();

    /** todayLine */
    const todayLine: Record<
      string,
      {
        status: string;
        text: string;
      }
    > = {
      today_pending: { status: 'pending', text: t('dt_pending_claim') },
      today_other: { status: 'in_progress', text: t('dt_in_progress') }
    };

    /** 常量或静态配置：pastPending */
    const pastPending = { status: 'pending' as const, text: t('dt_pending_claim') };
    return rawList.map((item, i) => {
      const bizStr = normalizeBizDate(item.bizDate);
      const isToday = bizStr === today;
      const cs = Number(item.claimStatus);
      const cfg = signCfg[cs] ?? signCfg[0];
      const row = (text: string, status: string): SignItem => ({
        key: `${bizStr}-${i}`,
        text,
        date: formatSignDate(item.bizDate, today),
        bizDate: item.bizDate,
        status,
        icon: pickSignIcon(isToday, cs),
        click: cfg?.click ?? true,
        claimStatus: cs,
        isToday
      });
      // 往日：待领取(1) 用 past_pending 文案，其它统一「已结束」
      if (!isToday) {
        if (cs === 1) return row(pastPending.text, pastPending.status);
        return row(t('dt_ended'), 'ended');
      }
      // 今日：待领取(1) 与 其它
      const key = cs === 1 ? 'today_pending' : 'today_other';
      const { status, text } = todayLine[key];
      return row(text, status);
    });
  };
  const fetchWageStatus = () => {
    if (signItems.value.length === 0) {
      signListLoading.value = true;
    }
    getWageStatusList()
      .then((res) => {
        if (res?.code !== 0 || !Array.isArray(res.data)) {
          claimDisabled.value = true;
          return;
        }
        const list = [...res.data].sort((a, b) =>
          normalizeBizDate(a.bizDate) > normalizeBizDate(b.bizDate) ? 1 : -1
        );
        claimDisabled.value = !list.some((item: any) => Number(item?.claimStatus) === 1);
        signItems.value = mapWageListToSignItems(list, getTodayStr());
      })
      .catch((e) => {
        console.error('[fetchWageStatus]', e);
        claimDisabled.value = true;
      })
      .finally(() => {
        signListLoading.value = false;
      });
  };
  const fetchRuleDesc = () => {
    if (ruleLoading.value) return;
    ruleLoading.value = true;
    getTaskDesc({})
      .then((res) => {
        if (res?.code === 0) {
          ruleDescription.value = res?.data?.description || '';
        } else {
          CreateErrorToast(res?.msg || t('dt_fetch_rule_fail'));
        }
      })
      .catch(() => {
        CreateErrorToast(t('dt_fetch_rule_fail'));
      })
      .finally(() => {
        ruleLoading.value = false;
      });
  };
  const fetchDailyWageSummary = () => {
    getDailyWageSummary().then((res) => {
      if (res?.code === 0) {
        dailyWageSummary.value = res?.data;
      }
    });
  };
  const applyProgressFromWageRules = (rules: AppActTaskWageRuleVO[] | undefined) => {
    if (!Array.isArray(rules) || rules.length === 0) {
      progressRewards.value = [...FALLBACK_PROGRESS_REWARDS];
      progressPoints.value = [...FALLBACK_PROGRESS_POINTS];
      return;
    }

    /** 常量或静态配置：sorted */
    const sorted = [...rules].sort((a, b) => Number(a.sort) - Number(b.sort));
    progressRewards.value = sorted.map((r) => Number(r.wageAmount));
    progressPoints.value = [0, ...sorted.map((r) => Number(r.minPoints))];
  };
  const progressRateFromAuditedVsMilestones = (
    auditedRaw: number,
    milestones: number[]
  ): number => {
    /** audited */
    const audited = Number(auditedRaw);
    if (!Number.isFinite(audited) || audited < 0) return 0;

    /** 常量或静态配置：m */
    const m = [...new Set(milestones.map((x) => Number(x)).filter((x) => Number.isFinite(x)))].sort(
      (a, b) => a - b
    );

    /** k */
    const k = m.length;
    if (k === 0) return 0;
    if (k === 1) return audited >= m[0] ? 100 : 0;

    /** last */
    const last = k - 1;
    if (audited <= m[0]) return 0;
    if (audited >= m[k - 1]) return 100;
    for (let i = 0; i < last; i++) {
      const a = m[i];
      const b = m[i + 1];
      if (audited === a) return (i / last) * 100;
      if (audited === b) return ((i + 1) / last) * 100;
      if (audited > a && audited < b) {
        const span = b - a;
        const t = span > 0 ? (audited - a) / span : 0;
        return ((i + t) / last) * 100;
      }
    }
    return 100;
  };
  const fetchDailyWageSettingList = () => {
    getDailyWageSettingList().then((res) => {
      if (res?.code === 0) {
        const data = res.data;
        applyProgressFromWageRules(data?.wageRules);
        const audited = Number(data?.todayAuditedPoints);
        progressRate.value = progressRateFromAuditedVsMilestones(audited, progressPoints.value);
        continueClaimDays.value = data?.continueClaimDays ?? 0;
      }
    });
  };
  const fetchTaskConfigList = () => {
    getTaskConfigList().then((res) => {
      if (res?.code === 0) {
        taskConfigList.value = res?.data.map((item: any) => ({
          ...item,
          icon: resolveTaskIconUrl(item.activityType)
        }));
      }
    });
  };
  // --- 任务弹窗 Computed ---
  const isSharePlatformTask = computed(
    () => currentTaskConfig.value?.activityType === 'SHARE_PLATFORM'
  );
  const taskProgressLabel = computed(() => {
    /** type */
    const type = currentTaskConfig.value?.activityType;
    return type === 'DIRECT_REGISTER'
      ? t('dt_task_count')
      : PROGRESS_TASK_TYPES.includes(type)
        ? t('dt_task_amount')
        : '';
  });
  const taskProgressValue = computed(() => {
    /** c */
    const c = currentTaskConfig.value;
    if (c?.activityType === 'CUSTOM') return '';
    return `${c?.currentProgress ?? 0}/${c?.targetProgress ?? 0}`;
  });
  const popupBtnText = computed(() =>
    t(AUDIT_BTN_MAP[currentTaskConfig.value?.auditStatus ?? 0] ?? 'dt_submit_task')
  );
  const popupBtnDisabled = computed(() => isAuditLocked(currentTaskConfig.value?.auditStatus));
  const sharePlatformList = computed(() => {
    /** raw */
    const raw = currentTaskConfig.value?.extConfigJson?.sharePlatform;
    if (!raw || !Array.isArray(raw))
      return DEFAULT_PLATFORMS.map((p) => ({ ...p, icon: PLATFORM_ICONS[p.key] ?? '' }));

    /** 常量或静态配置：emojiMap */
    const emojiMap: Record<string, string> = { tiktok: '♪', youtube: '▶', telegram: '✈', x: '𝕏' };
    return raw.slice(0, 6).map((p: any) => {
      const key = p?.key ?? String(p).toLowerCase().replace(/\s+/g, '');
      const label = p?.label ?? p?.name ?? String(p);
      const icon = PLATFORM_ICONS[key];
      return { key, label, icon, emoji: emojiMap[key] ?? '●' };
    });
  });
  const handleCloseTaskPopup = () => {
    showSignPopupQiandao.value = false;
  };
  const showSignPopupClick = (item: any) => {
    currentTaskConfig.value = item;
    taskUploadFiles.value = [];
    selectedPlatform.value = sharePlatformList.value[0]?.key ?? '';
    showSignPopupQiandao.value = true;
  };
  const handleTaskUpload =
    /** 任务凭证上传：使用全局 uploadFile 接口，与 UserBenefits 一致 */
    async (file: any) => {
      const files = Array.isArray(file) ? file : [file];
      CreateLoadingToast(t('dt_uploading'));
      try {
        for (const item of files) {
          const rawFile = item.file;
          item.status = 'uploading';
          item.message = t('dt_uploading');
          try {
            const res: any = await uploadFile({ file: rawFile, time: new Date().getTime() });
            if (res?.code === 0 && res?.data?.url) {
              item.status = 'done';
              item.url = res.data.url;
              item.message = '';
            } else {
              item.status = 'failed';
              item.message = res?.msg || t('dt_upload_fail');
              CreateErrorToast(res?.msg || t('dt_upload_fail'));
            }
          } catch {
            item.status = 'failed';
            item.message = t('dt_upload_fail');
            CreateErrorToast(t('dt_upload_fail'));
          }
        }
      } finally {
        CreateCloseToast();
      }
    };
  const isTaskProgressMet = (c: any): boolean => {
    /** type */
    const type = c?.activityType;
    if (type !== 'DIRECT_REGISTER' && !PROGRESS_TASK_TYPES.includes(type)) return true;

    /** cur */
    const cur = Number(c?.currentProgress ?? 0);

    /** tgt */
    const tgt = Number(c?.targetProgress ?? 0);
    if (!Number.isFinite(tgt) || tgt <= 0) return true;
    return cur >= tgt;
  };
  const submitTaskClick = (taskConfig: any) => {
    if (!isTaskProgressMet(taskConfig)) {
      CreateErrorToast(t('dt_task_incomplete_submit'));
      return;
    }

    /** imageUrls */
    const imageUrls = taskUploadFiles.value
      .filter((f: any) => f.status === 'done' && f.url)
      .map((f: any) => f.url);

    /** imageUrl */
    const imageUrl = imageUrls.length > 0 ? imageUrls.join(',') : undefined;
    if (taskConfig?.extConfigJson?.uploadRequired === true && !imageUrl) {
      CreateErrorToast(t('dt_upload_proof_required'));
      return;
    }
    submitTask({
      taskId: taskConfig.id,
      ...(imageUrl && { imageUrl })
    }).then((res) => {
      if (res?.code === 0) {
        CreateSuccessToast(t('dt_submit_success'));
        showSignPopupQiandao.value = false;
        taskUploadFiles.value = [];
        refreshAllData();
      } else {
        CreateErrorToast(res?.msg || t('dt_submit_fail'));
      }
    });
  };
  const GoClaimWage = () => {
    CreateConfirmDialog({
      title: t('dt_dialog_title'),
      message: t('dt_confirm_claim'),
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel')
    })
      .then(() => claimWage())
      .then((res) => {
        if (res?.code === 0) {
          CreateSuccessToast(t('dt_claim_success'));
          refreshAllData();
        }
      })
      .catch(() => {});
  };
  const showWagePopupClick = (item: any) => {
    currentWageDate.value = item.bizDate;
    showWagePopup.value = true;
    getWageRecordByDate({ bizDate: item.bizDate }).then((res) => {
      if (res?.code === 0) {
        wageRecordStatus.value = res?.data?.claimStatus ?? 0;
        progressRateValue.value = progressRateFromAuditedVsMilestones(
          res?.data?.todayAuditedPoints ?? 0,
          progressPoints.value
        );
      }
    });
  };
  const handleShowRule = () => {
    showRule.value = true;
    // 每次打开弹窗都刷新一次说明，保证内容最新
    fetchRuleDesc();
  };
  const handleHideRule = () => {
    showRule.value = false;
  };
  onBeforeMount(() => {
    UserStore.setActiveTab(4);
  });
  onMounted(() => {
    isActiveDailyTask()
      .then((res) => {
        if (res?.code === 0 && res.data?.activated === false && res.data?.settingEnabled === true) {
          enableStatusData.value = res.data;
          showNotActivatedModal.value = true;
        }
        refreshAllData();
      })
      .catch(() => {
        refreshAllData();
      })
      .finally(() => {
        activationGateLoading.value = false;
      });
  });
</script>

<style scoped lang="less">
  @task-fs: 0.88;
  @card-bg: #1a2147;
  @blue-light: #74bcff;

  .task-page {
    min-height: 100vh;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
    color: #fff;
    background: #010b3a;
  }

  .task-page :deep(.page-wrap__content) {
    background: transparent;
  }

  .task-page :deep(.van-nav-bar__title),
  .task-page :deep(.van-icon),
  .task-page :deep(.van-nav-bar__text) {
    color: #fff;
  }

  .task-page__nav-right {
    font-size: 0.3rem * @task-fs;
    color: rgba(255, 255, 255, 0.86);
  }

  .task-page__banner-img {
    width: 100%;
    height: 100%;
    border-radius: 0.24rem;
    overflow: hidden;
  }

  .task-page__banner-img :deep(.van-image__img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .task-page__tip {
    margin: 0.1rem 0 0.14rem;
    margin-top: 0.3rem;
    font-size: 0.24rem * @task-fs;
    text-align: center;
    color: #fff;
    position: relative;
    z-index: 3;
  }

  .task-page__sign-card {
    padding: 0 0.12rem 0.12rem;
    border-radius: 0.16rem;
    border: 1px solid #169dff;
    background: linear-gradient(180deg, #1a2450 0%, #1a2147 100%);
    margin-bottom: 0.16rem;
    position: relative;
    z-index: 2;
    box-shadow: inset 0 0 0 0.01rem rgba(34, 158, 255, 0.35);
    margin-left: 0.3rem;
    margin-right: 0.3rem;
    height: 5.2rem;
  }

  .task-page__sign-head {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    margin: 0 -0.12rem 0.12rem;
    min-height: 0.78rem;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(79, 141, 255, 0.14);
  }

  .task-page__sign-tab-under {
    height: 0.74rem;
    min-width: 2.24rem;
    padding: 0 0.24rem;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 0.3rem * @task-fs;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.2);
    background: linear-gradient(180deg, #57b8ff 0%, #2e8fe9 55%, #2f7ed0 100%);
    border-top-left-radius: 0.16rem;
    border-bottom-right-radius: 0.3rem;
    position: relative;
    z-index: 1;
  }

  .task-page__sign-head-cover {
    position: absolute;
    left: 2.02rem;
    top: 0;
    width: 0.52rem;
    height: 100%;
    transform: skewX(-36deg);
    background: @card-bg;
    z-index: 2;
  }

  .task-page__sign-days {
    padding-right: 0.14rem;
    padding-left: 0.34rem;
    font-size: 0.24rem * @task-fs;
    font-weight: 600;
    color: #fff;
    position: relative;
    z-index: 3;
    text-align: right;
  }

  .task-page__sign-days span {
    margin: 0 0.06rem;
    color: @blue-light;
    font-weight: 700;
    font-size: 0.3rem * @task-fs;
  }

  .task-page__sign-list {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.06rem;
    margin-top: 0.3rem;
  }

  @keyframes task-sign-skeleton-shine {
    0% {
      background-position: -80% 0;
    }

    100% {
      background-position: 180% 0;
    }
  }

  .task-page__sign-skeleton-item {
    --sk-delay: 0s;
    border-radius: 0.12rem;
    border: 1px solid rgba(114, 159, 255, 0.14);
    background: linear-gradient(180deg, rgba(12, 28, 82, 0.92) 0%, rgba(5, 13, 51, 0.96) 100%);
    min-height: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    position: relative;
    overflow: hidden;
    animation: task-sign-skeleton-pulse 1.35s ease-in-out infinite;
    animation-delay: var(--sk-delay);
  }

  @keyframes task-sign-skeleton-pulse {
    0%,
    100% {
      opacity: 0.72;
      border-color: rgba(114, 159, 255, 0.12);
    }

    50% {
      opacity: 1;
      border-color: rgba(116, 188, 255, 0.28);
    }
  }

  .task-page__sign-skeleton-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      transparent 0%,
      transparent 42%,
      rgba(116, 188, 255, 0.14) 50%,
      rgba(255, 216, 120, 0.06) 54%,
      transparent 58%,
      transparent 100%
    );
    background-size: 220% 100%;
    background-position: -80% 0;
    animation: task-sign-skeleton-shine 1.6s ease-in-out infinite;
    animation-delay: var(--sk-delay);
    pointer-events: none;
  }

  .task-page__sign-skeleton-icon {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(116, 188, 255, 0.14);
    box-shadow: inset 0 0 0.06rem rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 1;
  }

  .task-page__sign-skeleton-line {
    height: 0.12rem;
    border-radius: 0.06rem;
    background: rgba(116, 188, 255, 0.12);
    position: relative;
    z-index: 1;
  }

  .task-page__sign-skeleton-line--main {
    width: 74%;
  }

  .task-page__sign-skeleton-line--sub {
    width: 50%;
    opacity: 0.8;
  }

  .task-page__sign-item {
    border-radius: 0.12rem;
    border: 1px solid rgba(114, 159, 255, 0.18);
    background: linear-gradient(180deg, #071140 0%, #050d33 100%);
    min-height: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
  }

  .task-page__sign-item--done {
    background: linear-gradient(180deg, #0f6bc8 0%, #1948b2 100%);
  }

  .task-page__sign-item--done:nth-child(2) {
    box-shadow: inset 0 0 0 0.03rem #1aa7ff;
  }

  .task-page__sign-item--today {
    background: linear-gradient(180deg, #1373c9 0%, #2445ae 100%);
    border-color: #ffe08c;
  }

  /* 今日：无论待领取 / 进行中 / 已领取，统一深蓝→亮蓝渐变 + 金色描边 */
  .task-page__sign-item.task-page__sign-item--is-today {
    background: #1f6fd8;
    border: 1px solid #ffe08c;
    box-shadow: 0 0 0.06rem rgba(255, 216, 120, 0.35);
    color: #fff;
  }

  .task-page__sign-item.task-page__sign-item--is-today .task-page__sign-main,
  .task-page__sign-item.task-page__sign-item--is-today .task-page__sign-sub {
    color: #fff;
  }

  .task-page__sign-item--missed,
  .task-page__sign-item--ended {
    background: linear-gradient(180deg, #d6d6d6 0%, #9ea4ad 100%);
    color: #2c2f35;
  }

  .task-page__sign-item--in_progress {
    background: linear-gradient(180deg, #1373c9 0%, #2445ae 100%);
    border-color: #ffe08c;
  }

  /* 已领取：亮蓝底 + 橙圈白勾 + 白字（对齐设计稿） */
  .task-page__sign-item--claimed {
    background: linear-gradient(180deg, #1f7fe8 0%, #0d56c4 45%, #0a46a8 100%);
    border: 1px solid rgba(120, 190, 255, 0.45);
    color: #fff;
  }

  .task-page__sign-item--claimed .task-page__sign-main,
  .task-page__sign-item--claimed .task-page__sign-sub {
    color: #fff;
  }

  /* 今日 + 已领取：盖过上面 claimed 的蓝描边，仍用金边与统一渐变 */
  .task-page__sign-item.task-page__sign-item--is-today.task-page__sign-item--claimed {
    background: linear-gradient(180deg, #081845 0%, #123a78 38%, #1f6fd8 100%);
    border: 1px solid #ffe08c;
    box-shadow: 0 0 0.06rem rgba(255, 216, 120, 0.35);
  }

  .task-page__sign-icon--claimed {
    background: radial-gradient(
      circle at 32% 28%,
      #ffb347 0%,
      #ff8c1a 52%,
      #e86800 100%
    ) !important;
    box-shadow: 0 0.04rem 0.12rem rgba(0, 0, 0, 0.28);
  }

  .task-page__sign-icon {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe588 0%, #ff9a1d 75%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0.04rem 0.1rem rgba(0, 0, 0, 0.25);
  }

  .task-page__sign-icon span {
    font-size: 0.3rem * @task-fs;
    font-weight: 700;
    line-height: 1;
    color: #fff;
  }

  .task-page__sign-item--missed .task-page__sign-icon,
  .task-page__sign-item--ended .task-page__sign-icon {
    background: radial-gradient(circle at 30% 30%, #b8b8b8 0%, #8f949e 85%);
  }

  /* 今日格图标保持橙圈（盖过 ended/missed 的灰底） */
  .task-page__sign-item.task-page__sign-item--is-today:not(.task-page__sign-item--claimed)
    .task-page__sign-icon {
    background: radial-gradient(circle at 30% 30%, #ffe588 0%, #ff9a1d 75%) !important;
    box-shadow: 0 0.04rem 0.12rem rgba(0, 0, 0, 0.28);
  }

  .task-page__sign-item.task-page__sign-item--is-today .task-page__sign-icon span {
    color: #fff;
  }

  .task-page__sign-item--pending .task-page__sign-icon span,
  .task-page__sign-item--today .task-page__sign-icon span,
  .task-page__sign-item--in_progress .task-page__sign-icon span {
    color: #fff8d5;
  }

  .task-page__sign-main {
    font-size: 0.2rem * @task-fs;
    line-height: 1.1;
    font-weight: 600;
  }

  .task-page__sign-sub {
    font-size: 0.17rem * @task-fs;
    color: rgba(255, 255, 255, 0.92);
  }

  .task-page__sign-btn {
    width: 3.1rem;
    margin: 0.24rem auto 0.1rem;
    margin-top: 0.5rem;
    height: 0.85rem;
    border: none;
    font-size: 0.3rem * @task-fs;
    font-weight: 700;
    // background: linear-gradient(180deg, #1d8bfd 0%, #0e5ee1 58%, #0a46b9 100%) !important;
    box-shadow: inset 0 -0.02rem 0 rgba(255, 255, 255, 0.18);
  }

  .task-page__income-card {
    padding: 0.18rem 0.2rem;
    border-radius: 0.16rem;
    border: 1px solid rgba(77, 122, 255, 0.26);
    background: linear-gradient(180deg, #0d1f56 0%, #101840 100%);
    margin-bottom: 0.2rem;
    margin-left: 0.3rem;
    margin-right: 0.3rem;
    height: 90px;
  }

  .task-page__income-detail {
    text-align: right;
    font-size: 0.28rem * @task-fs;
    color: rgba(178, 212, 255, 0.86);
    margin-bottom: 0.14rem;
    margin-right: 0.3rem;
    margin-top: 0.3rem;
  }

  .task-page__income-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-page__income-cell {
    padding: 0.1rem 0.12rem;
  }

  // .task-page__income-cell+.task-page__income-cell {
  //   border-left: 1px solid rgba(104, 146, 255, 0.24);
  // }

  .task-page__income-label {
    font-size: 0.23rem * @task-fs;
    color: rgba(255, 255, 255, 0.8);
  }

  .task-page__income-value {
    margin-top: 0.06rem;
    font-size: 0.4rem * @task-fs;
    font-weight: 700;
    color: #7ac9ff;
  }

  .task-page__today {
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
    margin-left: 0.3rem;
    margin-right: 0.3rem;
  }

  .task-page__today-title {
    font-size: 0.32rem * @task-fs;
    font-weight: 700;
    margin-bottom: 0.12rem;
  }

  .task-page__progress {
    padding-top: 0.02rem;
  }

  .task-page__progress-top {
    display: grid;
    grid-template-columns: auto repeat(var(--progress-reward-cols, 4), minmax(0, 1fr));
    align-items: center;
    margin-bottom: 0.08rem;
    color: #fff;
  }

  .task-page__progress-pin-wrap {
    display: inline-flex;
    justify-content: flex-start;
    justify-self: start;
  }

  .task-page__progress-pin {
    font-size: 0.34rem * @task-fs;
    color: #ffffff;
  }

  .task-page__progress-reward-label {
    justify-self: center;
    text-align: center;
    font-size: 0.2rem * @task-fs;
    font-weight: 700;
  }

  .task-page__progress-line {
    position: relative;
    height: 0.24rem;
    border-radius: 999px;
    background: rgba(155, 171, 205, 0.38);
    overflow: hidden;
  }

  .task-page__progress-points {
    margin-top: 0.14rem;
    display: grid;
    grid-template-columns: auto repeat(var(--progress-reward-cols, 4), minmax(0, 1fr));
    align-items: center;
    color: #fff;
  }

  .task-page__progress-line-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, #58bcff 0%, #2f8fe8 40%, #1870d0 100%);
  }

  .task-page__progress-point-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.01rem;
    font-size: 0.2rem * @task-fs;
    font-weight: 700;
    text-align: center;
    min-width: 0;
    justify-self: center;
  }

  .task-page__progress-point-item:first-child {
    justify-self: start;
    justify-content: flex-start;
  }

  .task-page__progress-coin {
    width: 0.24rem;
    height: 0.24rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe7a3 0%, #ffc34d 32%, #ff8a00 100%);
    position: relative;
    flex-shrink: 0;
  }

  .task-page__progress-coin::before {
    content: '★';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.14rem * @task-fs;
    color: #fffbe6;
  }

  .task-page__task-center {
    padding: 0;
    border-radius: 0.22rem;
    overflow: hidden;
    border: 1px solid #0ea1ff;
    background: #1a2147;
    margin: 0 0.3rem 0.3rem;
    box-shadow:
      inset 0 0 0 0.01rem rgba(57, 167, 255, 0.24),
      0 0.08rem 0.24rem rgba(4, 20, 77, 0.28);
  }

  .task-page__task-center-head {
    height: 0.74rem;
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid rgba(79, 141, 255, 0.12);
    position: relative;
    overflow: hidden;
  }

  .task-page__task-center-tab-under {
    min-width: 2.34rem;
    padding: 0 0.24rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 0.3rem * @task-fs;
    font-weight: 700;
    letter-spacing: 0;
    color: #fff;
    background: linear-gradient(180deg, #ff6c43 0%, #ff5f3d 52%, #ff7646 100%);
    border-top-left-radius: 0.22rem;
    border-bottom-right-radius: 0.28rem;
    position: relative;
    box-shadow: inset 0 -0.02rem 0 rgba(255, 255, 255, 0.14);
    z-index: 1;
  }

  .task-page__task-center-head-cover {
    position: absolute;
    left: 2.06rem;
    top: 0;
    width: 0.5rem;
    height: 100%;
    background: @card-bg;
    transform: skewX(-36deg);
    z-index: 2;
  }

  .task-page__task-center-text {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 2.1rem;
    font-size: 0.25rem * @task-fs;
    font-weight: 600;
    color: #f2f6ff;
    position: relative;
    z-index: 3;
  }

  .task-page__task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.2rem 0.22rem;
    position: relative;
  }

  .task-page__task-row:not(:first-of-type)::before {
    content: '';
    position: absolute;
    left: 0.22rem;
    right: 0.22rem;
    top: 0;
    border-top: 1px dashed rgba(101, 163, 255, 0.35);
  }

  .task-page__task-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.18rem;
  }

  .task-page__task-icon {
    width: 0.68rem;
    height: 0.68rem;
    border-radius: 0.2rem;
    border: 1px solid #7ab9ff;
    background: linear-gradient(180deg, #1f63c4 0%, #1b3a87 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-page__task-icon :deep(.van-icon) {
    font-size: 0.34rem * @task-fs;
    color: #ffffff;
  }

  .task-page__task-name {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }

  .task-page__task-name-text {
    font-size: 0.3rem * @task-fs;
    font-weight: 700;
    color: #79c4ff;
  }

  .task-page__task-reward {
    display: inline-flex;
    align-items: center;
    gap: 0.03rem;
    font-size: 0.34rem * @task-fs;
    font-weight: 700;
    color: #fff;
  }

  .task-page__task-reward-coin {
    width: 0.26rem;
    height: 0.26rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe7a3 0%, #ffc34d 32%, #ff8a00 100%);
    position: relative;
  }

  .task-page__task-reward-coin::before {
    content: '★';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.14rem * @task-fs;
    color: #fffbe6;
  }

  .task-page__task-desc {
    margin-top: 0.04rem;
    font-size: 0.22rem * @task-fs;
    color: rgba(255, 255, 255, 0.9);
  }

  .task-page__task-btn {
    min-width: 1.52rem;
    height: 0.62rem;
    border: 1px solid #2f8fff;
    font-size: 0.28rem * @task-fs;
    font-weight: 700;
    color: #fff !important;
    background: linear-gradient(180deg, #1e7ee2 0%, #0d55c8 62%, #0b3ea7 100%) !important;
    box-shadow:
      inset 0 -0.02rem 0 rgba(255, 255, 255, 0.2),
      0 0.04rem 0.12rem rgba(12, 68, 184, 0.32);
  }

  /* ---------- 玩法说明弹窗（对齐 Rank 活动说明样式） ---------- */
  /* 去掉 modal/!w-full，避免 design 里 .modal 在窄屏强制定宽 100%；两侧 0.32rem 间隙 + 最大 6.4rem */
  .task-page__rule-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__rule-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .task-page__rule-card {
    position: relative;
    border-radius: 0.44rem;
    background: #091f4a;
    color: #ffffff;
  }

  .task-page__rule-inner {
    padding: 0.6rem 0.4rem 0.36rem;
    border-radius: 0.36rem;
    position: relative;
    overflow: visible;
  }

  .task-page__rule-tab {
    position: absolute;
    top: 0.05rem;
    left: 0.2rem;
    width: 3.7rem;
    height: 0.8rem;
  }

  .task-page__rule-tab-bg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .task-page__rule-tab-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.3rem * @task-fs;
    font-weight: 600;
    color: #ffffff;
  }

  .task-page__rule-section {
    margin-top: 0.42rem;
    font-size: 0.24rem * @task-fs;
    line-height: 1.7;
  }

  .task-page__rule-desc {
    white-space: pre-line;
  }

  .task-page__rule-confirm {
    margin-top: 0.48rem;
    height: 0.9rem;
    font-size: 0.3rem * @task-fs;
    background: linear-gradient(90deg, #3b8cff 0%, #0b49c4 60%, #072a83 100%) !important;
    border: none !important;
  }

  .task-page__rule-mascot {
    position: fixed;
    top: 1rem;
    right: -0.25rem;
    width: 3.1rem;
    height: auto;
    z-index: 110000;
    pointer-events: none;
    transform: rotate(-15deg);
  }

  .task-page__rule-close {
    position: fixed;
    top: 1.2rem;
    right: 0.5rem;

    width: 0.56rem;
    height: 0.56rem;
    z-index: 999999;
  }

  :deep(.task-page__rule-popup.van-popup--center) {
    top: 55% !important;
    height: 73% !important;
    /* 不全屏：最大 6.4rem，且相对视口左右各留 0.32rem 间隙 */
    left: 50% !important;
    right: auto !important;
    width: min(6.4rem, calc(100vw - 0.64rem)) !important;
    max-width: min(6.4rem, calc(100vw - 0.64rem)) !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    background: transparent !important;
    box-sizing: border-box;
  }

  /* ---------- 每日签到弹窗 ---------- */
  .task-page__sign-popup {
    width: 100%;
    background: transparent;
  }

  .task-page__sign-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__sign-popup-overlay {
    background: rgba(0, 0, 0, 0.55);
  }

  .task-page__sign-popup-card {
    position: relative;
    border-radius: 0.28rem 0.28rem 0 0;
    padding: 0.34rem 0.3rem calc(0.34rem + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, #0a1228 0%, #07101f 100%);
    border: 1px solid rgba(118, 187, 255, 0.2);
    box-shadow: 0 -0.08rem 0.24rem rgba(0, 0, 0, 0.4);
  }

  .task-page__sign-popup-card--share {
    background: linear-gradient(180deg, #0a1228 0%, #050c1a 100%);
  }

  .task-page__sign-popup-close {
    position: absolute;
    top: 0.24rem;
    right: 0.3rem;
    width: 0.56rem;
    height: 0.56rem;
    border-radius: 50%;
    background: linear-gradient(180deg, #3b8cff 0%, #1a6be8 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.32rem;
    box-shadow: 0 0.04rem 0.12rem rgba(59, 140, 255, 0.4);
    cursor: pointer;
    z-index: 10;
  }

  .task-page__sign-popup-close :deep(.van-icon) {
    color: #fff;
  }

  .task-page__sign-popup-title {
    font-size: 0.38rem * @task-fs;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.12rem;
    padding-right: 0.6rem;
  }

  .task-page__sign-popup-hint {
    font-size: 0.24rem * @task-fs;
    color: #74bcff;
    margin-bottom: 0.2rem;
    line-height: 1.4;
  }

  .task-page__sign-platform-row {
    display: flex;
    gap: 0.2rem;
    margin-bottom: 0.28rem;
  }

  .task-page__sign-platform-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.12rem;
    cursor: pointer;
    margin-right: 0.3rem;
    max-width: 1.8rem;
  }

  .task-page__sign-platform-icon {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .task-page__sign-platform-icon--tiktok {
    background: #000;
  }

  .task-page__sign-platform-icon--youtube {
    background: #fff;
  }

  .task-page__sign-platform-icon--youtube .task-page__sign-platform-emoji {
    color: #ff0000;
    font-size: 0.5rem;
  }

  .task-page__sign-platform-icon--telegram {
    background: #29b6f2;
  }

  .task-page__sign-platform-icon img {
    width: 70%;
    height: 70%;
    object-fit: contain;
  }

  .task-page__sign-platform-emoji {
    font-size: 0.48rem;
    color: #fff;
  }

  .task-page__sign-platform-icon--youtube .task-page__sign-platform-emoji {
    color: #ff0000;
  }

  .task-page__sign-platform-item--active .task-page__sign-platform-icon {
    box-shadow: 0 0 0 0.06rem #169dff;
  }

  .task-page__sign-platform-label {
    font-size: 0.22rem * @task-fs;
    color: #fff;
    text-align: center;
  }

  .task-page__sign-popup-block {
    margin-bottom: 0.24rem;
  }

  .task-page__sign-popup-subtitle {
    font-size: 0.26rem * @task-fs;
    font-weight: 600;
    color: rgba(180, 210, 255, 0.9);
    margin-bottom: 0.08rem;
  }

  .task-page__sign-popup-text {
    font-size: 0.26rem * @task-fs;
    color: #fff;
    line-height: 1.45;
  }

  .task-page__sign-popup-star {
    color: #ffd54f;
    margin-right: 0.04rem;
  }

  .task-page__sign-popup-upload {
    margin-top: 0.1rem;
  }

  .task-page__sign-popup-upload-trigger {
    width: 1.6rem;
    height: 1.6rem;
    border: 1px dashed rgba(154, 197, 255, 0.65);
    border-radius: 0.12rem;
    background: rgba(11, 25, 69, 0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.08rem;
    color: rgba(196, 223, 255, 0.86);
    font-size: 0.22rem * @task-fs;
  }

  .task-page__sign-popup-upload :deep(.van-uploader__upload) {
    margin: 0;
  }

  .task-page__sign-popup-upload :deep(.van-uploader__preview-image) {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 0.12rem;
  }

  .task-page__sign-popup-btn {
    margin-top: 0.2rem;
    margin-left: 0;
    margin-right: 0;
    height: 0.9rem;
    font-size: 0.32rem * @task-fs;
    font-weight: 700;
    border: none !important;
    border-radius: 0.45rem !important;
    background: linear-gradient(90deg, #3b8cff 0%, #1a6be8 60%, #0d4cb5 100%) !important;
    box-shadow: 0 0.04rem 0.12rem rgba(59, 140, 255, 0.3);
  }

  /* ---------- 领取工资弹窗（与设计图一致） ---------- */
  .task-page__wage-popup {
    width: 100%;
    max-width: 7rem;
    background: transparent;
  }

  .task-page__wage-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__wage-popup-overlay {
    background: rgba(0, 0, 0, 0.65);
  }

  .task-page__wage-popup-card {
    position: relative;
    padding: 0.6rem 0.4rem 0.5rem;
    border-radius: 0.36rem;
    background: #06163a;
    border: 1px solid rgba(0, 242, 255, 0.35);
    box-shadow: 0 0.16rem 0.4rem rgba(0, 0, 0, 0.4);
    color: #fff;
  }

  .task-page__wage-popup-close {
    position: fixed;
    top: 4.8rem;
    right: 0.3rem;
    width: 0.56rem;
    height: 0.56rem;

    z-index: 999999;
  }

  .task-page__wage-popup-close :deep(img) {
    width: 0.32rem;
    height: 0.32rem;
    filter: brightness(0) invert(1);
  }

  .task-page__wage-popup-title {
    font-size: 0.4rem * @task-fs;
    font-weight: 700;
    color: #fff;
    text-align: center;
    margin-bottom: 0.08rem;
  }

  .task-page__wage-popup-subtitle {
    font-size: 0.24rem * @task-fs;
    color: rgba(178, 212, 255, 0.9);
    text-align: center;
    margin-bottom: 0.34rem;
  }

  .task-page__wage-popup-btn {
    margin-top: 0.4rem;
    height: 0.9rem;
    font-size: 0.32rem * @task-fs;
    font-weight: 700;
    border: none !important;
    background: linear-gradient(
      180deg,
      #3ba5ff 0%,
      #1d8bfd 35%,
      #0e5ee1 70%,
      #0a46b9 100%
    ) !important;
    box-shadow:
      inset 0 -0.02rem 0 rgba(255, 255, 255, 0.18),
      0 0.08rem 0.2rem rgba(8, 70, 186, 0.4);
  }

  :deep(.task-page__wage-popup.van-popup) {
    background: transparent !important;
  }

  /* 激活校验门控 / 未激活说明 */
  .task-page__gate-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #010b3a;
  }

  .task-page__gate-loading :deep(.van-loading__text) {
    color: rgba(255, 255, 255, 0.55);
  }

  /* 未激活说明：与玩法说明共用 task-page__rule-card，下列仅内容区在深色底上的排版与字色 */
  .task-page__not-activated-intro {
    font-size: 0.24rem * @task-fs;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.92);
    margin: 0 0 0.28rem;
    white-space: pre-line;
  }

  /* 产品块：左标签与右侧多行列表整体垂直居中 */
  .task-page__not-activated-block--projects {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.2rem;
    margin-bottom: 0.24rem;
    font-size: 0.26rem;
    line-height: 1.45;
  }

  .task-page__not-activated-val-list {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
  }

  .task-page__not-activated-val-line {
    color: rgba(255, 255, 255, 0.95);
    text-align: right;
    font-weight: 600;
    word-break: break-word;
  }

  /* 条件行：左标签 + 右内容（左右排列） */
  .task-page__not-activated-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.2rem;
    margin-bottom: 0.24rem;
    font-size: 0.26rem;
    line-height: 1.45;
  }

  .task-page__not-activated-key {
    flex: 0 0 46%;
    max-width: 46%;
    min-width: 46%;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.88);
    text-align: left;
    box-sizing: border-box;
  }

  .task-page__not-activated-val {
    flex: 1;
    min-width: 0;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
    text-align: right;
    word-break: break-word;
  }
</style>
