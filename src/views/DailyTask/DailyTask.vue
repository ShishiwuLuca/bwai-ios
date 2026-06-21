<template>
  <div class="task-page-shell page-shell">
    <!-- 先拉 enable-status，请求结束前只显示加载 -->
    <div v-if="activationGateLoading" class="task-page__gate-loading">
      <Loading type="spinner" vertical>{{ t('dt_loading') }}</Loading>
    </div>
    <!-- 门控结束后始终渲染正文；未激活时另叠一层说明弹窗 -->
    <ConfigProvider v-else theme="light">
    <PageWrap class="task-page">
      <NavBar :title="t('dt_title')" left-arrow fixed placeholder :border="false">
        <template #right>
          <span class="task-page__nav-right" @click="handleShowRule">{{ t('dt_rule') }}</span>
        </template>
      </NavBar>

      <div class="task-page__content">
        <div class="task-page__banner">
          <Image :src="taskBanner" class="task-page__banner-img" fit="cover" />
        </div>

        <div class="task-page__card task-page__sign-card">
          <div class="task-page__sign-head">
            <div class="task-page__sign-tab-under">{{ t('dt_daily_wage') }}</div>
            <div class="task-page__sign-head-cover"></div>
            <div class="task-page__sign-days">
              <span v-for="(segment, index) in signDaysSegments" :key="index">
                <span v-if="segment.highlight" class="task-page__sign-days-num">{{ segment.text }}</span>
                <template v-else>{{ segment.text }}</template>
              </span>
            </div>
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
        </div>
        <div class="task-page__income-detail" @click="router.push('/SalaryDetail')">{{
          t('dt_salary_detail')
        }}</div>
        <div class="task-page__card task-page__income-card">
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
        </div>

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

        <div class="task-page__card task-page__task-center">
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
                <img v-if="item.icon" :src="item.icon" alt="" class="task-page__task-icon-img" />
                <Icon v-else name="orders-o" />
              </div>
              <div class="task-page__task-info">
                <div class="task-page__task-name">
                  <span class="task-page__task-name-text">{{ item.title }}</span>
                  <span class="task-page__task-reward">
                    <i class="task-page__task-reward-coin"></i>+{{ item.points }}
                  </span>
                </div>
                <div class="task-page__task-desc">{{ getTaskRowDesc(item) }}</div>
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
        </div>
      </div>

      <!-- 玩法说明弹窗 -->
      <Popup
        v-model:show="showRule"
        position="center"
        class="task-page__rule-popup"
        overlay-class="task-page__rule-overlay"
      >
        <div class="task-page__rule-shell">
          <!-- <button
            type="button"
            class="task-page__rule-close-btn"
            aria-label="close"
              @click="handleHideRule"
            >
            <Icon name="cross" size="16" color="#fff" />
          </button> -->
          <div class="task-page__rule-panel">
            <h3 class="task-page__rule-title">{{ t('dt_rule_title') }}</h3>
            <div class="task-page__rule-body">
              <p v-if="ruleLoading" class="task-page__rule-loading">{{ t('dt_loading') }}</p>
              <div v-else class="task-page__rule-desc" v-html="ruleDescription"></div>
            </div>
            <button type="button" class="task-page__rule-confirm-btn" @click="handleHideRule">
              {{ t('confirm') }}
            </button>
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
        <div class="task-page__sign-popup-card">
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

          <div class="task-page__sign-popup-body">
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

    <!-- 未激活说明弹窗 -->
    <Popup
      v-model:show="showNotActivatedModal"
      position="center"
      :close-on-click-overlay="false"
      class="task-page__rule-popup"
      overlay-class="task-page__rule-overlay"
    >
      <div class="task-page__rule-shell">
        <button
          type="button"
          class="task-page__rule-close-btn"
          aria-label="close"
          @click="closeNotActivatedModal"
        >
          <Icon name="cross" size="16" color="#fff" />
        </button>
        <div class="task-page__rule-panel">
          <h3 class="task-page__rule-title">{{ t('dt_activation_title') }}</h3>
          <div class="task-page__rule-body">
            <p class="task-page__not-activated-intro">{{ t('dt_activation_intro') }}</p>
            <div class="task-page__not-activated-block task-page__not-activated-block--projects">
              <span class="task-page__not-activated-key">{{ t('dt_activation_projects_label') }}</span>
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
          <button type="button" class="task-page__rule-confirm-btn" @click="closeNotActivatedModal">
            {{ t('tp_close') }}
          </button>
        </div>
      </div>
    </Popup>
    </ConfigProvider>
  </div>
</template>

<script setup lang="ts">
  import { ref, shallowRef, computed, onMounted, onBeforeMount } from 'vue';
  import { NavBar, PageWrap, CountTo } from '/@/components';
  import { Button, Image, Icon, Popup, Uploader, Loading, ConfigProvider } from 'vant';
  import { useRouter } from 'vue-router';
  import taskBanner from '/@/assets/images/Task/taskBanner.png';
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
    ClaimStatus,
    type AppActTaskWageRuleVO,
    type AppActTaskWageStatusRespVO,
    type AppDailyTaskEnableStatusVO
  } from '/@/service/Task';
  import { uploadFile } from '/@/service/System';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  type BizDate = string | number[];
  type UploadFileItem = { file?: File; status?: string; message?: string; url?: string };

  type SignItem = {
    key: string;
    text: string;
    date: string;
    bizDate: BizDate;
    status: string;
    icon: string;
    click: boolean;
    claimStatus?: number;
    isToday?: boolean;
  };

  type TaskConfigItem = {
    id?: number;
    title?: string;
    activityType?: string;
    auditStatus?: number;
    points?: number;
    currentProgress?: number;
    targetProgress?: number;
    description?: string;
    extConfigJson?: {
      uploadRequired?: boolean;
      sharePlatform?: Array<{ key?: string; label?: string; name?: string } | string>;
    };
    icon?: string;
  };

  const PLATFORM_ICONS: Record<string, string> = {
    tiktok: tiktokIcon,
    youtube: youtubeIcon,
    telegram: telegramIcon,
    x: XIcon,
    X: XIcon
  };

  const DEFAULT_PLATFORMS = [
    { key: 'tiktok', label: 'Tik Tok', emoji: '♪' },
    { key: 'youtube', label: 'YouTube', emoji: '▶' },
    { key: 'telegram', label: 'Telegram', emoji: '✈' }
  ];

  const PLATFORM_EMOJI: Record<string, string> = {
    tiktok: '♪',
    youtube: '▶',
    telegram: '✈',
    x: '𝕏'
  };

  const PROGRESS_TASK_TYPES = [
    'DIRECT_INVEST',
    'ACCUMULATED_RECHARGE',
    'DIRECT_ACCUMULATED_RECHARGE'
  ] as const;

  const AUDIT_ROW_BTN: Record<number, string> = {
    0: 'dt_go_complete',
    1: 'dt_auditing',
    2: 'dt_completed',
    3: 'dt_go_complete'
  };

  const AUDIT_POPUP_BTN: Record<number, string> = {
    0: 'dt_submit_task',
    1: 'dt_auditing',
    2: 'dt_completed',
    3: 'dt_resubmit'
  };

  const AUDIT_SORT_WEIGHT: Record<number, number> = { 0: 0, 3: 0, 1: 1, 2: 2 };

  const FALLBACK_PROGRESS_REWARDS = [1, 2, 5, 10];
  const FALLBACK_PROGRESS_POINTS = [0, 70, 90, 100, 150];
  const SIGN_GRID_COLUMNS = 7;
  const SIGN_SKELETON_INDICES = Array.from({ length: SIGN_GRID_COLUMNS }, (_, i) => i + 1);

  const TASK_ICON_MODULES = import.meta.glob<string>('../../assets/images/Task/*.png', {
    eager: true,
    query: '?url',
    import: 'default'
  });

  const router = useRouter();
  const { t } = useI18n();
  const userStore = useUserStoreWithOut();
  const {
    CreateErrorToast,
    CreateSuccessToast,
    CreateConfirmDialog,
    CreateLoadingToast,
    CreateCloseToast
  } = useMessage();

  const toNum = (value: unknown, fallback = 0) => Number(value ?? fallback);
  const toAuditStatus = (value: unknown) => toNum(value);
  const isAuditLocked = (status: unknown) => {
    const auditStatus = toAuditStatus(status);
    return auditStatus === 1 || auditStatus === 2;
  };
  const pad2 = (n: number) => String(n).padStart(2, '0');

  const normalizeBizDate = (bizDate: unknown): string => {
    if (bizDate == null) return '';
    if (typeof bizDate === 'string') return bizDate;
    if (Array.isArray(bizDate) && bizDate.length >= 3) {
      const [y, m, d] = bizDate;
      return `${y}-${pad2(toNum(m))}-${pad2(toNum(d))}`;
    }
    return '';
  };

  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  };

  const formatSignDate = (bizDate: BizDate, todayStr = getTodayStr()) => {
    const dateStr = normalizeBizDate(bizDate);
    if (!dateStr) return '';
    if (dateStr === todayStr) return t('dt_sign_today');
    const [, month, day] = dateStr.split('-');
    return month && day ? `${month}-${day}` : dateStr;
  };

  const pickSignIcon = (isToday: boolean, claimStatus: number) =>
    isToday || claimStatus === ClaimStatus.Claimable ? '★' : '✓';

  const resolveTaskIconUrl = (activityType: string): string => {
    const keys = Object.keys(TASK_ICON_MODULES);
    const matched = keys.find((key) => key.endsWith(`/${activityType}.png`));
    if (matched) return TASK_ICON_MODULES[matched];
    const fallback = keys.find((key) => key.endsWith('/CUSTOM.png'));
    return fallback ? TASK_ICON_MODULES[fallback] : '';
  };

  const progressRateFromAuditedVsMilestones = (auditedRaw: number, milestones: number[]) => {
    const audited = toNum(auditedRaw);
    if (audited < 0) return 0;

    const points = [...new Set(milestones.map(toNum).filter((n) => n >= 0))].sort((a, b) => a - b);
    const lastIndex = points.length - 1;
    if (lastIndex < 0) return 0;
    if (lastIndex === 0) return audited >= points[0] ? 100 : 0;
    if (audited <= points[0]) return 0;
    if (audited >= points[lastIndex]) return 100;

    for (let i = 0; i < lastIndex; i++) {
      const start = points[i];
      const end = points[i + 1];
      if (audited === start) return (i / lastIndex) * 100;
      if (audited === end) return ((i + 1) / lastIndex) * 100;
      if (audited > start && audited < end) {
        const ratio = end > start ? (audited - start) / (end - start) : 0;
        return ((i + ratio) / lastIndex) * 100;
      }
    }
    return 100;
  };

  const activationGateLoading = ref(true);
  const showNotActivatedModal = ref(false);
  const enableStatusData = ref<AppDailyTaskEnableStatusVO | null>(null);

  const progressRewards = ref([...FALLBACK_PROGRESS_REWARDS]);
  const progressPoints = ref([...FALLBACK_PROGRESS_POINTS]);
  const progressRate = ref(0);
  const progressRateValue = ref(0);
  const showRule = ref(false);
  const showSignPopupQiandao = ref(false);
  const taskUploadFiles = ref<UploadFileItem[]>([]);
  const showWagePopup = ref(false);
  const ruleLoading = ref(false);
  const ruleDescription = ref('');
  const signItems = shallowRef<SignItem[]>([]);
  const signListLoading = ref(true);
  const dailyWageSummary = ref<Record<string, unknown>>({});
  const continueClaimDays = ref(0);
  const taskConfigList = ref<TaskConfigItem[]>([]);
  const currentTaskConfig = ref<TaskConfigItem>({});
  const selectedPlatform = ref('');
  const currentWageDate = ref<BizDate>('');
  const wageRecordStatus = ref(0);
  const claimDisabled = ref(true);

  const activationProductNamesList = computed(() => {
    const names = enableStatusData.value?.productNames
      ?.map((name) => String(name).trim())
      .filter(Boolean);
    return names?.length ? names : ['—'];
  });

  const activationAmountLabel = computed(() => {
    const data = enableStatusData.value;
    if (!data) return '';
    const label = String(data.limitTypeText ?? '').trim() || t('dt_activation_invest_default');
    return t('dt_activation_satisfy_label', [label]);
  });

  const activationAmountValue = computed(() => {
    const data = enableStatusData.value;
    if (!data) return '';
    return `${toNum(data.currentAmount)} / ${toNum(data.limitAmount)} USDT`;
  });

  const signDaysSegments = computed(() => {
    const days = String(continueClaimDays.value);
    const text = t('dt_claim_days', [days]);
    const index = text.indexOf(days);
    if (index === -1) return [{ text, highlight: false }];
    return [
      { text: text.slice(0, index), highlight: false },
      { text: days, highlight: true },
      { text: text.slice(index + days.length), highlight: false }
    ].filter((segment) => segment.text);
  });

  const progressGridVars = computed(() => ({
    '--progress-reward-cols': String(Math.max(1, progressRewards.value.length))
  }));

  const wagePopupProgressWidth = computed(() => Math.min(progressRateValue.value, 100));

  const wagePopupSubtitle = computed(() => {
    const dateStr = normalizeBizDate(currentWageDate.value);
    if (!dateStr) return '';
    return `${formatSignDate(currentWageDate.value)}${t('dt_activity_suffix')}`;
  });

  const sortedTaskConfigList = computed(() =>
    [...taskConfigList.value].sort((a, b) => {
      const statusDiff =
        (AUDIT_SORT_WEIGHT[toAuditStatus(a.auditStatus)] ?? 3) -
        (AUDIT_SORT_WEIGHT[toAuditStatus(b.auditStatus)] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return toNum(a.id) - toNum(b.id);
    })
  );

  const isSharePlatformTask = computed(
    () => currentTaskConfig.value.activityType === 'SHARE_PLATFORM'
  );

  const taskProgressLabel = computed(() => {
    const type = currentTaskConfig.value.activityType;
    if (type === 'DIRECT_REGISTER') return t('dt_task_count');
    if (type && (PROGRESS_TASK_TYPES as readonly string[]).includes(type)||type === 'TEAM_FOLLOW_ORDER'||type === 'PERSONAL_FOLLOW_ORDER') {
      return t('dt_task_amount');
    }
    return '';
  });

  const taskProgressValue = computed(() => {
    const task = currentTaskConfig.value;
    if (task.activityType === 'CUSTOM') return '';
    return `${task.currentProgress ?? 0}/${task.targetProgress ?? 0}`;
  });

  const popupBtnText = computed(() =>
    t(AUDIT_POPUP_BTN[toAuditStatus(currentTaskConfig.value.auditStatus)] ?? 'dt_submit_task')
  );

  const popupBtnDisabled = computed(() => isAuditLocked(currentTaskConfig.value.auditStatus));

  const sharePlatformList = computed(() => {
    const raw = currentTaskConfig.value.extConfigJson?.sharePlatform;
    if (!Array.isArray(raw) || raw.length === 0) {
      return DEFAULT_PLATFORMS.map((platform) => ({
        ...platform,
        icon: PLATFORM_ICONS[platform.key] ?? ''
      }));
    }

    return raw.slice(0, 6).map((platform) => {
      const key =
        typeof platform === 'object' && platform
          ? platform.key ?? String(platform).toLowerCase().replace(/\s+/g, '')
          : String(platform).toLowerCase().replace(/\s+/g, '');
      const label =
        typeof platform === 'object' && platform
          ? platform.label ?? platform.name ?? String(platform)
          : String(platform);
      return {
        key,
        label,
        icon: PLATFORM_ICONS[key] ?? '',
        emoji: PLATFORM_EMOJI[key] ?? '●'
      };
    });
  });

  const taskRowBtnText = (item: TaskConfigItem) =>
    t(AUDIT_ROW_BTN[toAuditStatus(item.auditStatus)] ?? '');

  const taskRowBtnDisabled = (item: TaskConfigItem) => isAuditLocked(item.auditStatus);

  /** 任务列表说明：优先展示后端任务要求，为空时回退 i18n 占位 */
  const getTaskRowDesc = (item: TaskConfigItem) => {
    const desc = item.description?.trim();
    if (desc) return desc;
    return t('dt_task_desc', [item.title ?? '']);
  };

  const closeNotActivatedModal = () => {
    showNotActivatedModal.value = false;
    router.back();
  };

  const refreshAllData = () => {
    fetchWageStatus();
    fetchDailyWageSummary();
    fetchDailyWageSettingList();
    fetchTaskConfigList();
  };

  const createSignItem = (
    item: AppActTaskWageStatusRespVO,
    index: number,
    today: string,
    text: string,
    status: string
  ): SignItem => {
      const bizStr = normalizeBizDate(item.bizDate);
      const isToday = bizStr === today;
    const claimStatus = toNum(item.claimStatus);
    return {
      key: `${bizStr}-${index}`,
        text,
        date: formatSignDate(item.bizDate, today),
        bizDate: item.bizDate,
        status,
      icon: pickSignIcon(isToday, claimStatus),
      click: true,
      claimStatus,
        isToday
    };
  };

  const mapWageListToSignItems = (rawList: AppActTaskWageStatusRespVO[], today: string) =>
    rawList.map((item, index) => {
      const claimStatus = toNum(item.claimStatus);
      const isToday = normalizeBizDate(item.bizDate) === today;

      if (!isToday) {
        if (claimStatus === ClaimStatus.Claimable) {
          return createSignItem(item, index, today, t('dt_pending_claim'), 'pending');
        }
        return createSignItem(item, index, today, t('dt_ended'), 'ended');
      }

      if (claimStatus === ClaimStatus.Claimable) {
        return createSignItem(item, index, today, t('dt_pending_claim'), 'pending');
      }
      return createSignItem(item, index, today, t('dt_in_progress'), 'in_progress');
    });

  const fetchWageStatus = () => {
    if (signItems.value.length === 0) signListLoading.value = true;

    getWageStatusList()
      .then((res) => {
        if (res?.code !== 0 || !Array.isArray(res.data)) {
          claimDisabled.value = true;
          return;
        }

        const list = [...res.data].sort((a, b) =>
          normalizeBizDate(a.bizDate).localeCompare(normalizeBizDate(b.bizDate))
        );
        claimDisabled.value = !list.some((item) => item.claimStatus === ClaimStatus.Claimable);
        signItems.value = mapWageListToSignItems(list, getTodayStr());
      })
      .catch((error) => {
        console.error('[fetchWageStatus]', error);
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
          ruleDescription.value = res.data?.description || '';
          return;
        }
        CreateErrorToast(res?.msg || t('dt_fetch_rule_fail'));
      })
      .catch(() => CreateErrorToast(t('dt_fetch_rule_fail')))
      .finally(() => {
        ruleLoading.value = false;
      });
  };

  const fetchDailyWageSummary = () => {
    getDailyWageSummary().then((res) => {
      if (res?.code === 0) dailyWageSummary.value = res.data ?? {};
    });
  };

  const applyProgressFromWageRules = (rules?: AppActTaskWageRuleVO[]) => {
    if (!rules?.length) {
      progressRewards.value = [...FALLBACK_PROGRESS_REWARDS];
      progressPoints.value = [...FALLBACK_PROGRESS_POINTS];
      return;
    }

    const sorted = [...rules].sort((a, b) => toNum(a.sort) - toNum(b.sort));
    progressRewards.value = sorted.map((rule) => toNum(rule.wageAmount));
    progressPoints.value = [0, ...sorted.map((rule) => toNum(rule.minPoints))];
  };

  const fetchDailyWageSettingList = () => {
    getDailyWageSettingList().then((res) => {
      if (res?.code !== 0) return;
        const data = res.data;
        applyProgressFromWageRules(data?.wageRules);
      progressRate.value = progressRateFromAuditedVsMilestones(
        toNum(data?.todayAuditedPoints),
        progressPoints.value
      );
        continueClaimDays.value = data?.continueClaimDays ?? 0;
    });
  };

  const fetchTaskConfigList = () => {
    getTaskConfigList().then((res) => {
      if (res?.code !== 0 || !Array.isArray(res.data)) return;
      taskConfigList.value = res.data.map((item) => ({
          ...item,
          icon: resolveTaskIconUrl(item.activityType)
        }));
    });
  };

  const handleCloseTaskPopup = () => {
    showSignPopupQiandao.value = false;
  };

  const showSignPopupClick = (item: TaskConfigItem) => {
    currentTaskConfig.value = item;
    taskUploadFiles.value = [];
    selectedPlatform.value = sharePlatformList.value[0]?.key ?? '';
    showSignPopupQiandao.value = true;
  };

  const isProgressTaskType = (type?: string) =>
    type === 'DIRECT_REGISTER' ||
    (!!type && (PROGRESS_TASK_TYPES as readonly string[]).includes(type));

  const isTaskProgressMet = (task: TaskConfigItem) => {
    const { activityType, currentProgress, targetProgress } = task;
    if (!isProgressTaskType(activityType)) return true;
    const target = toNum(targetProgress);
    if (target <= 0) return true;
    return toNum(currentProgress) >= target;
  };

  const handleTaskUpload = async (file: UploadFileItem | UploadFileItem[]) => {
      const files = Array.isArray(file) ? file : [file];
      CreateLoadingToast(t('dt_uploading'));

      try {
        for (const item of files) {
          item.status = 'uploading';
          item.message = t('dt_uploading');
          try {
          const res = await uploadFile({ file: item.file, time: Date.now() });
          if (res?.code === 0 && res.data?.url) {
              item.status = 'done';
              item.url = res.data.url;
              item.message = '';
            continue;
          }
              item.status = 'failed';
              item.message = res?.msg || t('dt_upload_fail');
          CreateErrorToast(item.message);
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

  const submitTaskClick = (taskConfig: TaskConfigItem) => {
    if (!isTaskProgressMet(taskConfig)) {
      CreateErrorToast(t('dt_task_incomplete_submit'));
      return;
    }

    const imageUrl = taskUploadFiles.value
      .filter((file) => file.status === 'done' && file.url)
      .map((file) => file.url)
      .join(',');

    if (taskConfig.extConfigJson?.uploadRequired && !imageUrl) {
      CreateErrorToast(t('dt_upload_proof_required'));
      return;
    }

    submitTask({
      taskId: taskConfig.id,
      ...(imageUrl ? { imageUrl } : {})
    }).then((res) => {
      if (res?.code === 0) {
        CreateSuccessToast(t('dt_submit_success'));
        showSignPopupQiandao.value = false;
        taskUploadFiles.value = [];
        refreshAllData();
        return;
      }
      CreateErrorToast(res?.msg || t('dt_submit_fail'));
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

  const showWagePopupClick = (item: SignItem) => {
    currentWageDate.value = item.bizDate;
    showWagePopup.value = true;

    getWageRecordByDate({ bizDate: item.bizDate }).then((res) => {
      if (res?.code !== 0) return;
      wageRecordStatus.value = res.data?.claimStatus ?? 0;
        progressRateValue.value = progressRateFromAuditedVsMilestones(
        res.data?.todayAuditedPoints ?? 0,
          progressPoints.value
        );
    });
  };

  const handleClaimWage = () => {
    showWagePopup.value = false;
    claimDailyWage({ bizDate: currentWageDate.value }).then((res) => {
      if (res?.code === 0) {
        CreateSuccessToast(t('dt_claim_success'));
        refreshAllData();
        return;
      }
      CreateErrorToast(res?.msg || t('dt_claim_fail'));
    });
  };

  const handleShowRule = () => {
    showRule.value = true;
    fetchRuleDesc();
  };

  const handleHideRule = () => {
    showRule.value = false;
  };

  onBeforeMount(() => {
    userStore.setActiveTab(1);
  });

  onMounted(() => {
    isActiveDailyTask()
      .then((res) => {
        const data = res?.data;
        if (res?.code === 0 && data?.activated === false && data.settingEnabled === true) {
          enableStatusData.value = data;
          showNotActivatedModal.value = true;
        }
        refreshAllData();
      })
      .catch(() => refreshAllData())
      .finally(() => {
        activationGateLoading.value = false;
      });
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
  @popup-gradient: linear-gradient(145deg, #e2d3fc 0%, #fff 38%, #fff 72%, #c5edfd 100%);
  @card-bg: @white;

  .task-page {
    min-height: 100vh;
    padding-bottom: calc(0.48rem + env(safe-area-inset-bottom, 0px));
    color: @text;
    background: transparent;
  }

  .task-page :deep(.page-wrap__content) {
    background: transparent;
  }

  .task-page__content {
    padding: 0 0.32rem 0.32rem;
  }

  .task-page__nav-right {
    font-size: 0.28rem;
    font-weight: 500;
    color: @blue;
    cursor: pointer;
  }

  .task-page__banner {
    margin: 0 -0.32rem 0;
    overflow: hidden;
  }

  .task-page__banner-img {
    display: block;
    width: 100%;
    height: auto;
  }

  .task-page__banner-img :deep(.van-image__img) {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .task-page__card {
    border-radius: 0.24rem;
    background: @white;
    box-shadow: @shadow;
  }

  .task-page__tip {
    margin: 0.2rem 0 0;
    font-size: 0.22rem;
    line-height: 1.45;
    text-align: center;
    color: @label;
  }

  /* ---------- 签到卡片 ---------- */
  .task-page__sign-card {
    position: relative;
    z-index: 2;
    margin: -0.56rem 0 0.24rem;
    padding: 0 0.2rem 0.24rem;
    overflow: hidden;
  }

  .task-page__sign-head {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    min-height: 0.76rem;
    margin: 0 -0.2rem 0.16rem;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid @border;
  }

  .task-page__sign-tab-under {
    min-width: 2.1rem;
    height: 0.72rem;
    padding: 0 0.24rem;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 0.28rem;
    font-weight: 700;
    color: @white;
    background: @btn-gradient;
    border-top-left-radius: 0.24rem;
    border-bottom-right-radius: 0.28rem;
    position: relative;
    z-index: 1;
  }

  .task-page__sign-head-cover {
    position: absolute;
    left: 1.92rem;
    top: 0;
    width: 0.48rem;
    height: 100%;
    background: @card-bg;
    transform: skewX(-36deg);
    z-index: 2;
  }

  .task-page__sign-days {
    padding-right: 0.16rem;
    padding-left: 0.28rem;
    font-size: 0.24rem;
    font-weight: 500;
    color: @label;
    text-align: right;
    position: relative;
    z-index: 3;
  }

  .task-page__sign-days :deep(span),
  .task-page__sign-days-num {
    margin: 0 0.04rem;
    color: @blue;
    font-size: 0.28rem;
    font-weight: 700;
  }

  .task-page__sign-list {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.08rem;
    margin-top: 0.16rem;
  }

  @keyframes task-sign-skeleton-shine {
    0% {
      background-position: -80% 0;
    }

    100% {
      background-position: 180% 0;
    }
  }

  @keyframes task-sign-skeleton-pulse {
    0%,
    100% {
      opacity: 0.72;
    }

    50% {
      opacity: 1;
    }
  }

  .task-page__sign-skeleton-item {
    --sk-delay: 0s;
    min-height: 1.44rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.08rem;
    border: 1px solid @border;
    border-radius: 0.12rem;
    background: #f3f6ff;
    position: relative;
    overflow: hidden;
    animation: task-sign-skeleton-pulse 1.35s ease-in-out infinite;
    animation-delay: var(--sk-delay);
  }

  .task-page__sign-skeleton-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      transparent 0%,
      transparent 42%,
      rgba(146, 182, 255, 0.2) 50%,
      transparent 58%,
      transparent 100%
    );
    background-size: 220% 100%;
    animation: task-sign-skeleton-shine 1.6s ease-in-out infinite;
    animation-delay: var(--sk-delay);
    pointer-events: none;
  }

  .task-page__sign-skeleton-icon {
    width: 0.44rem;
    height: 0.44rem;
    border-radius: 50%;
    background: rgba(146, 182, 255, 0.25);
    position: relative;
    z-index: 1;
  }

  .task-page__sign-skeleton-line {
    height: 0.1rem;
    border-radius: 0.06rem;
    background: rgba(146, 182, 255, 0.2);
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
    min-height: 1.44rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.06rem;
    padding: 0.08rem 0.04rem;
    border: 1px solid #dbe6ff;
    border-radius: 0.12rem;
    background: #f3f6ff;
    color: @value;
  }

  .task-page__sign-item--pending {
    background: #f3f6ff;
    border-color: #dbe6ff;
    color: @label;
  }

  .task-page__sign-item--done,
  .task-page__sign-item--in_progress {
    background: linear-gradient(180deg, #5b9dff 0%, #2a61f9 100%);
    border-color: transparent;
    color: @white;
  }

  .task-page__sign-item--claimed {
    background: linear-gradient(180deg, #5b9dff 0%, #1a37fd 100%);
    border-color: transparent;
    color: @white;
  }

  .task-page__sign-item.task-page__sign-item--is-today {
    background: linear-gradient(180deg, #6ca9ff 0%, #2a61f9 100%);
    border: 1px solid #ffc857;
    box-shadow: 0 0 0.06rem rgba(255, 200, 87, 0.45);
    color: @white;
  }

  .task-page__sign-item--missed,
  .task-page__sign-item--ended {
    background: #eceff4;
    border-color: #dfe3ea;
    color: #9aa3b2;
  }

  .task-page__sign-item.task-page__sign-item--is-today .task-page__sign-main,
  .task-page__sign-item.task-page__sign-item--is-today .task-page__sign-sub,
  .task-page__sign-item--done .task-page__sign-main,
  .task-page__sign-item--done .task-page__sign-sub,
  .task-page__sign-item--claimed .task-page__sign-main,
  .task-page__sign-item--claimed .task-page__sign-sub,
  .task-page__sign-item--in_progress .task-page__sign-main,
  .task-page__sign-item--in_progress .task-page__sign-sub {
    color: @white;
  }

  .task-page__sign-icon {
    width: 0.44rem;
    height: 0.44rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe588 0%, #ff9a1d 75%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0.04rem 0.08rem rgba(255, 154, 29, 0.28);
  }

  .task-page__sign-icon--claimed {
    background: radial-gradient(circle at 32% 28%, #ffb347 0%, #ff8c1a 52%, #e86800 100%) !important;
  }

  .task-page__sign-icon span {
    font-size: 0.24rem;
    font-weight: 700;
    line-height: 1;
    color: @white;
  }

  .task-page__sign-item--missed .task-page__sign-icon,
  .task-page__sign-item--ended .task-page__sign-icon {
    background: radial-gradient(circle at 30% 30%, #d0d4db 0%, #a8aeb8 85%);
    box-shadow: none;
  }

  .task-page__sign-item--missed .task-page__sign-icon span,
  .task-page__sign-item--ended .task-page__sign-icon span {
    color: @white;
  }

  .task-page__sign-main {
    font-size: 0.18rem;
    line-height: 1.15;
    font-weight: 600;
    text-align: center;
  }

  .task-page__sign-sub {
    font-size: 0.16rem;
    line-height: 1.1;
    color: @label;
    text-align: center;
  }

  .task-page__sign-item--pending .task-page__sign-sub {
    color: @label;
  }

  .task-page__sign-btn {
    width: 100%;
    max-width: 4.8rem;
    height: 0.84rem;
    margin: 0.28rem auto 0;
    border: none !important;
    border-radius: 0.42rem !important;
    font-size: 0.3rem !important;
    font-weight: 700 !important;
    background: @btn-gradient !important;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);
  }

  .task-page__sign-btn.van-button--disabled {
    background: #e8edf5 !important;
    color: @label !important;
    box-shadow: none;
    opacity: 1;
  }

  /* ---------- 工资汇总 ---------- */
  .task-page__income-detail {
    margin: 0.08rem 0 0.12rem;
    font-size: 0.26rem;
    font-weight: 500;
    color: @blue;
    text-align: right;
    cursor: pointer;
  }

  .task-page__income-card {
    margin-bottom: 0.24rem;
    padding: 0.28rem 0.24rem;
  }

  .task-page__income-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.16rem;
  }

  .task-page__income-cell {
    padding: 0.08rem 0.12rem;
    text-align: center;

    &:first-child {
      border-right: 1px solid @border;
    }
  }

  .task-page__income-label {
    font-size: 0.24rem;
    color: @label;
  }

  .task-page__income-value {
    margin-top: 0.1rem;
    font-size: 0.4rem;
    font-weight: 600;
    color: @blue;
    line-height: 1.2;

    :deep(.count-to),
    :deep(span) {
      font-weight: inherit;
      color: inherit;
      font-size: inherit;
    }
  }

  /* ---------- 今日任务进度 ---------- */
  .task-page__today {
    margin-bottom: 0.24rem;
  }

  .task-page__today-title {
    margin-bottom: 0.16rem;
    font-size: 0.3rem;
    font-weight: 700;
    color: @text;
  }

  .task-page__progress {
    padding: 0.08rem 0.04rem 0;
  }

  .task-page__progress-top {
    display: grid;
    grid-template-columns: auto repeat(var(--progress-reward-cols, 4), minmax(0, 1fr));
    align-items: center;
    margin-bottom: 0.1rem;
    color: @value;
  }

  .task-page__progress-pin-wrap {
    display: inline-flex;
    justify-content: flex-start;
    justify-self: start;
  }

  .task-page__progress-pin {
    font-size: 0.32rem;
    color: @blue;
  }

  .task-page__progress-reward-label {
    justify-self: center;
    font-size: 0.22rem;
    font-weight: 700;
    color: @blue;
    text-align: center;
  }

  .task-page__progress-line {
    position: relative;
    height: 0.2rem;
    border-radius: 999px;
    background: #3B435D;
    overflow: hidden;
  }

  .task-page__progress-line-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: inherit;
    background: @btn-gradient;
  }

  .task-page__progress-points {
    display: grid;
    grid-template-columns: auto repeat(var(--progress-reward-cols, 4), minmax(0, 1fr));
    align-items: center;
    margin-top: 0.12rem;
    color: @value;
  }

  .task-page__progress-point-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.04rem;
    min-width: 0;
    font-size: 0.22rem;
    font-weight: 700;
    text-align: center;
    justify-self: center;
  }

  .task-page__progress-point-item:first-child {
    justify-self: start;
    justify-content: flex-start;
  }

  .task-page__progress-coin {
    width: 0.24rem;
    height: 0.24rem;
    flex-shrink: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe7a3 0%, #ffc34d 32%, #ff8a00 100%);
    position: relative;
  }

  .task-page__progress-coin::before {
    content: '★';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.14rem;
    color: #fffbe6;
  }

  /* ---------- 任务中心 ---------- */
  .task-page__task-center {
    margin-bottom: 0.24rem;
    padding: 0;
    overflow: hidden;
  }

  .task-page__task-center-head {
    display: flex;
    align-items: stretch;
    position: relative;
    min-height: 0.72rem;
    overflow: hidden;
    border-bottom: 1px solid @border;
  }

  .task-page__task-center-tab-under {
    min-width: 2.1rem;
    padding: 0 0.24rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 0.28rem;
    font-weight: 700;
    color: @white;
    background: @btn-gradient;
    border-top-left-radius: 0.24rem;
    border-bottom-right-radius: 0.28rem;
    position: relative;
    z-index: 1;
  }

  .task-page__task-center-head-cover {
    position: absolute;
    left: 1.92rem;
    top: 0;
    width: 0.48rem;
    height: 100%;
    background: @card-bg;
    transform: skewX(-36deg);
    z-index: 2;
  }

  .task-page__task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.16rem;
    padding: 0.24rem 0.22rem;
    position: relative;
  }

  .task-page__task-row:not(:first-of-type)::before {
    content: '';
    position: absolute;
    left: 0.22rem;
    right: 0.22rem;
    top: 0;
    border-top: 1px dashed #dbe6ff;
  }

  .task-page__task-left {
    display: flex;
    align-items: center;
    gap: 0.16rem;
    min-width: 0;
    flex: 1;
  }

  .task-page__task-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 0.18rem;
    background: linear-gradient(180deg, #6ca9ff 0%, #2a61f9 100%);
    box-shadow: 0 0.04rem 0.12rem rgba(42, 97, 249, 0.22);
  }

  .task-page__task-icon-img {
    width: 0.44rem;
    height: 0.44rem;
    object-fit: contain;
  }

  .task-page__task-icon :deep(.van-icon) {
    font-size: 0.36rem;
    color: @white;
  }

  .task-page__task-name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.08rem;
  }

  .task-page__task-name-text {
    font-size: 0.28rem;
    font-weight: 700;
    background: linear-gradient(180deg, #6ca9ff 0%, #2071f8 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }

  .task-page__task-reward {
    display: inline-flex;
    align-items: center;
    gap: 0.04rem;
    font-size: 0.28rem;
    font-weight: 700;
    color: #ff8a00;
  }

  .task-page__task-reward-coin {
    width: 0.24rem;
    height: 0.24rem;
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
    font-size: 0.14rem;
    color: #fffbe6;
  }

  .task-page__task-info {
    min-width: 0;
    flex: 1;
  }

  .task-page__task-desc {
    margin-top: 0.06rem;
    font-size: 0.22rem;
    color: @label;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-page__task-btn {
    flex-shrink: 0;
    min-width: 1.44rem;
    height: 0.6rem;
    padding: 0 0.2rem;
    border: none !important;
    border-radius: 0.3rem !important;
    font-size: 0.26rem !important;
    font-weight: 700 !important;
    color: @white !important;
    background: @btn-gradient !important;
    box-shadow: 0 0.04rem 0.12rem rgba(42, 97, 249, 0.24);
  }

  .task-page__task-btn.van-button--disabled {
    background: #e8edf5 !important;
    color: @label !important;
    box-shadow: none;
    opacity: 1;
  }

  /* ---------- 玩法说明 / 未激活弹窗 ---------- */
  .task-page__rule-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__rule-overlay {
    background: rgba(0, 0, 0, 0.45);
  }

  .task-page__rule-shell {
    position: relative;
    width: min(6.3rem, calc(100vw - 0.64rem));
    max-width: 6.3rem;
  }

  .task-page__rule-close-btn {
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

  .task-page__rule-panel {
    display: flex;
    flex-direction: column;
    max-height: 78vh;
    padding: 0.48rem 0.32rem 0.32rem;
    border-radius: 0.48rem;
    background: @popup-gradient;
    box-shadow: 0 0.16rem 0.48rem rgba(51, 102, 255, 0.18);
  }

  .task-page__rule-title {
    margin: 0;
    padding: 0 0.16rem;
    font-size: 0.34rem;
    font-weight: 700;
    line-height: 1.35;
    color: @text;
    text-align: center;
  }

  .task-page__rule-body {
    flex: 1;
    min-height: 0;
    margin: 0.24rem 0;
    padding: 0.24rem 0.22rem;
    border-radius: 0.2rem;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(232, 236, 245, 0.9);
    max-height: 52vh;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .task-page__rule-loading {
    margin: 0;
    font-size: 0.26rem;
    line-height: 1.6;
    color: @label;
    text-align: center;
  }

  .task-page__rule-desc {
    font-size: 0.26rem;
    line-height: 1.75;
    color: #444;
    word-break: break-word;
    white-space: pre-line;

    :deep(p) {
      margin: 0 0 0.2rem;
    }

    :deep(p:last-child) {
      margin-bottom: 0;
    }

    :deep(strong),
    :deep(b) {
      font-weight: 700;
      color: @text;
    }

    :deep(ul),
    :deep(ol) {
      margin: 0.12rem 0 0.2rem;
      padding-left: 0.36rem;
    }

    :deep(li) {
      margin-bottom: 0.1rem;
    }

    :deep(li:last-child) {
      margin-bottom: 0;
    }
  }

  .task-page__rule-confirm-btn {
    width: 100%;
    height: 0.88rem;
    border: none;
    border-radius: 0.44rem;
    background: @btn-gradient;
    color: @white;
    font-size: 0.3rem;
    font-weight: 700;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);
    cursor: pointer;
  }

  :deep(.task-page__rule-popup.van-popup--center) {
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    width: auto !important;
    max-width: none !important;
    height: auto !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    background: transparent !important;
    overflow: visible;
  }

  /* ---------- 任务弹窗 ---------- */
  .task-page__sign-popup {
    width: 100%;
    background: transparent;
  }

  .task-page__sign-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__sign-popup-overlay {
    background: rgba(0, 0, 0, 0.45);
  }

  .task-page__sign-popup-card {
    position: relative;
    padding: 0.36rem 0.32rem calc(0.36rem + env(safe-area-inset-bottom));
    border-radius: 0.32rem 0.32rem 0 0;
    background: @popup-gradient;
    box-shadow: 0 -0.08rem 0.24rem rgba(51, 102, 255, 0.18);
    color: @text;
  }

  .task-page__sign-popup-body {
    margin-bottom: 0.24rem;
    padding: 0.24rem 0.22rem;
    border-radius: 0.2rem;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(232, 236, 245, 0.9);
  }

  .task-page__sign-popup-close {
    position: absolute;
    top: 0.24rem;
    right: 0.28rem;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.56rem;
    height: 0.56rem;
    border-radius: 50%;
    background: @btn-gradient;
    color: @white;
    cursor: pointer;
    box-shadow: 0 0.04rem 0.12rem rgba(42, 97, 249, 0.28);
  }

  .task-page__sign-popup-close :deep(.van-icon) {
    color: @white;
  }

  .task-page__sign-popup-title {
    margin-bottom: 0.12rem;
    padding-right: 0.64rem;
    font-size: 0.34rem;
    font-weight: 700;
    color: @text;
  }

  .task-page__sign-popup-hint {
    margin-bottom: 0.2rem;
    font-size: 0.24rem;
    line-height: 1.45;
    color: @blue;
  }

  .task-page__sign-platform-row {
    display: flex;
    gap: 0.2rem;
    margin-bottom: 0.24rem;
  }

  .task-page__sign-platform-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    max-width: 1.8rem;
    cursor: pointer;
  }

  .task-page__sign-platform-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.12rem;
    height: 1.12rem;
    border-radius: 0.18rem;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .task-page__sign-platform-icon--tiktok {
    background: #000;
  }

  .task-page__sign-platform-icon--youtube {
    background: #fff;
    border: 1px solid @border;
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
    color: @white;
  }

  .task-page__sign-platform-item--active .task-page__sign-platform-icon {
    box-shadow: 0 0 0 0.04rem @blue;
  }

  .task-page__sign-platform-label {
    font-size: 0.22rem;
    color: @value;
    text-align: center;
  }

  .task-page__sign-popup-block {
    margin-bottom: 0.2rem;
  }

  .task-page__sign-popup-subtitle {
    margin-bottom: 0.08rem;
    font-size: 0.24rem;
    font-weight: 600;
    color: @label;
  }

  .task-page__sign-popup-text {
    font-size: 0.26rem;
    line-height: 1.45;
    color: @value;
  }

  .task-page__sign-popup-star {
    margin-right: 0.04rem;
    color: #ff8a00;
  }

  .task-page__sign-popup-upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.08rem;
    width: 1.56rem;
    height: 1.56rem;
    border: 1px dashed #c5d4ff;
    border-radius: 0.12rem;
    background: #f3f6ff;
    color: @label;
    font-size: 0.22rem;
  }

  .task-page__sign-popup-upload :deep(.van-uploader__upload) {
    margin: 0;
  }

  .task-page__sign-popup-upload :deep(.van-uploader__preview-image) {
    width: 1.56rem;
    height: 1.56rem;
    border-radius: 0.12rem;
  }

  .task-page__sign-popup-btn {
    height: 0.88rem;
    margin-top: 0.2rem;
    border: none !important;
    border-radius: 0.44rem !important;
    font-size: 0.3rem !important;
    font-weight: 700 !important;
    background: @btn-gradient !important;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);
  }

  /* ---------- 领取工资弹窗 ---------- */
  .task-page__wage-popup {
    width: 100%;
    max-width: 6.4rem;
    background: transparent;
  }

  .task-page__wage-popup :deep(.van-popup__content) {
    overflow: visible;
  }

  .task-page__wage-popup-overlay {
    background: rgba(0, 0, 0, 0.45);
  }

  .task-page__wage-popup-card {
    position: relative;
    padding: 0.48rem 0.36rem 0.4rem;
    border-radius: 0.48rem;
    background: @popup-gradient;
    box-shadow: 0 0.16rem 0.48rem rgba(51, 102, 255, 0.18);
    color: @text;
  }

  .task-page__wage-popup-close {
    position: fixed;
    top: 30%;
    right: calc(50% - min(3.2rem, 50vw - 0.64rem));
    z-index: 999999;
    width: 0.64rem;
    height: 0.64rem;
    transform: translate(50%, -50%);
    cursor: pointer;
  }

  .task-page__wage-popup-title {
    margin-bottom: 0.08rem;
    font-size: 0.36rem;
    font-weight: 700;
    color: @text;
    text-align: center;
  }

  .task-page__wage-popup-subtitle {
    margin-bottom: 0.28rem;
    font-size: 0.24rem;
    color: @label;
    text-align: center;
  }

  .task-page__wage-popup-btn {
    height: 0.88rem;
    margin-top: 0.32rem;
    border: none !important;
    border-radius: 0.44rem !important;
    font-size: 0.3rem !important;
    font-weight: 700 !important;
    background: @btn-gradient !important;
    box-shadow: 0 0.06rem 0.18rem rgba(42, 97, 249, 0.28);
  }

  :deep(.task-page__wage-popup.van-popup) {
    background: transparent !important;
    overflow: visible;
  }

  /* ---------- 门控 / 未激活 ---------- */
  .task-page__gate-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #eef2fd;
  }

  .task-page__gate-loading :deep(.van-loading__text) {
    color: @label;
  }

  .task-page__not-activated-intro {
    margin: 0 0 0.24rem;
    font-size: 0.26rem;
    line-height: 1.65;
    color: #555;
    white-space: pre-line;
  }

  .task-page__not-activated-block--projects {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem;
    margin-bottom: 0.2rem;
    font-size: 0.26rem;
    line-height: 1.45;
  }

  .task-page__not-activated-val-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.08rem;
    min-width: 0;
  }

  .task-page__not-activated-val-line {
    font-weight: 600;
    color: @value;
    text-align: right;
    word-break: break-word;
  }

  .task-page__not-activated-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.2rem;
    margin-bottom: 0;
    padding-top: 0.16rem;
    border-top: 1px dashed #dbe6ff;
    font-size: 0.26rem;
    line-height: 1.45;
  }

  .task-page__not-activated-key {
    flex: 0 0 46%;
    max-width: 46%;
    min-width: 46%;
    box-sizing: border-box;
    font-weight: 600;
    color: @label;
    text-align: left;
  }

  .task-page__not-activated-val {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    color: @blue;
    text-align: right;
    word-break: break-word;
  }
</style>

<style lang="less">
  .task-page__rule-popup.van-popup {
    overflow: visible;
    background: transparent;
  }

  .task-page__sign-popup.van-popup {
    background: transparent;
  }
</style>
