<template>
  <div class="team-page-shell">
    <NavBar :show-left="false" fixed placeholder :border="false" :title="t('tp_title')">
      <template #left>
        <VanImage :src="Logo" height="0.6rem" width="2.2rem" />
      </template>
      <template #right>
        <div class="flex items-center gap-1">
          <Icon class-prefix="exchange-icon" name="locale" :size="25" color="var(--van-primary-color)"
            @click="emitEvent('ShowLocales')" />
          <Icon name="chat-o" :size="28" @click="$router.push('/Notice')" />
        </div>
      </template>
    </NavBar>
    <PageWrap class="team-page">
      <Tabs :key="route.fullPath" :active="activeTab" class="team-page__tabs" type="card" :border="false" :line-height="0"
        @update:active="onTabsActiveUpdate">
        <Tab :title="t('tp_tab_team')" name="team" />
        <Tab :title="t('tp_tab_reward')" name="reward" />
      </Tabs>
  
      <div v-if="activeTab === 'team'" class="team-page__content">
        <div class="team-page__section-head">
          <span class="team-page__section-bar" aria-hidden="true"></span>
          <span class="team-page__section-title">{{ t('tp_overview') }}</span>
        </div>
        <AppCard class="team-page__card team-page__card--overview">
          <div class="team-page__overview">
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team1.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.dcount1 ?? 0)" :decimals="0" />
                </div>
                <div class="team-page__label">{{ t('tp_direct_total') }}</div>
              </div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team2.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.dcount2 ?? 0)" :decimals="0" />
                </div>
                <div class="team-page__label">
                  {{ t('tp_direct_active') }}
                  <Popover v-model:show="showEffectiveUserTipDirect" theme="light" placement="top" :offset="[0, 6]"
                    teleport="body" class="team-page__effective-popover">
                    <template #reference>
                      <Icon name="question-o" class="team-page__label-icon" />
                    </template>
                    <div class="team-page__effective-tip">{{ t('tp_effective_user_tip') }}</div>
                  </Popover>
                </div>
              </div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team3.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.tcount1 ?? 0)" :decimals="0" />
                </div>
                <div class="team-page__label">{{ t('tp_team_total') }}</div>
              </div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team4.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.tcount2 ?? 0)" :decimals="0" />
                </div>
                <div class="team-page__label">
                  {{ t('tp_team_active') }}
                  <Popover v-model:show="showEffectiveUserTipTeam" theme="light" placement="top" :offset="[0, 6]"
                    teleport="body" class="team-page__effective-popover">
                    <template #reference>
                      <Icon name="question-o" class="team-page__label-icon" />
                    </template>
                    <div class="team-page__effective-tip">{{ t('tp_effective_user_tip') }}</div>
                  </Popover>
                </div>
              </div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team5.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.teamInvestAmount ?? 0)" :decimals="2" />
                </div>
                <div class="team-page__label">{{ t('tp_team_invest') }}</div>
              </div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__overview-icon">
                <img src="/@/assets/images/team6.png" width="30" height="30" alt="" class="team-page__label-icon" />
              </div>
              <div class="team-page__overview-text">
                <div class="team-page__num">
                  <CountTo :startVal="0" :endVal="Number(teamInfo.directPoint ?? 0)"/>
                </div>
                <div class="team-page__label">{{ t('tp_my_point') }}</div>
              </div>
            </div>
          </div>
        </AppCard>
  
        <div class="team-page__section-head">
          <span class="team-page__section-bar" aria-hidden="true"></span>
          <span class="team-page__section-title">{{ t('tp_invite_title') }}</span>
        </div>
        <AppCard class="team-page__card team-page__invite-card">
          <div class="team-page__invite">
            <div class="team-page__invite-row">
              <span class="team-page__invite-meta">
                {{ t('tp_member_id') }}:
                <CountTo v-if="teamInfo.uid != null" :startVal="0" :endVal="Number(teamInfo.uid)" :decimals="0" />
                <template v-else>-</template>
              </span>
              <span class="team-page__invite-meta">
                {{ t('tp_referrer_uid') }}:
                <CountTo v-if="teamInfo.pid != null" :startVal="0" :endVal="Number(teamInfo.pid)" :decimals="0" />
                <template v-else>-</template>
              </span>
            </div>
            <div class="team-page__invite-divider"></div>
            <div class="team-page__invite-main">
              <div class="team-page__invite-fields">
                <div class="team-page__invite-line">
                  <span class="team-page__invite-line-label">{{ t('tp_invite_code') }}</span>
                  <span class="team-page__invite-line-value">{{ teamInfo.myInviteCode || '-' }}</span>
                  <Icon name="description" class="team-page__copy-icon" @click="copyInviteCode" />
                </div>
                <div class="team-page__invite-line">
                  <span class="team-page__invite-line-label">{{ t('tp_invite_link') }}</span>
                  <span class="team-page__invite-line-value team-page__invite-line-value--ellipsis">{{ inviteLink
                    }}</span>
                  <Icon name="description" class="team-page__copy-icon" @click="copyInviteLink" />
                </div>
              </div>
              <img :src="inviteGiftImg" alt="" class="team-page__invite-gift" />
            </div>
            <InviteModal>
              <Button type="primary" block round class="team-page__invite-btn">{{
                t('tp_invite_title')
                }}</Button>
            </InviteModal>
          </div>
        </AppCard>
  
        <div class="team-page__section-head">
          <span class="team-page__section-bar" aria-hidden="true"></span>
          <span class="team-page__section-title">{{ t('tp_invite_title') }}</span>
        </div>
        <PullRefresh v-model="memberRefreshing" @refresh="onMemberRefresh">
          <List :loading="memberLoading" :finished="memberFinished" :finished-text="t('mts_no_more')"
            :immediate-check="false" @load="onMemberLoad">
            <AppCard v-for="(item, i) in teamList" :key="item.uid ?? i" class="team-page__member-card">
              <div class="team-page__member-head">
                <span class="team-page__member-title">
                  <img :src="AvatarImg" alt="" class="team-page__member-avatar" />
                  <span class="team-page__member-id">{{ t('mts_user_id') }} {{ item.uid ?? '-' }}</span>
                  <img :src="teamMemberLevelBadgeSrc(item.level)" alt="" class="team-page__member-crown" />
                </span>
                <span v-if="canDrillDownMember(item)" class="team-page__member-link" role="button"
                  @click="goSubordinate(item)">
                  {{ t('mts_subordinate') }}
                  <Icon name="arrow" class="team-page__member-link-icon" />
                </span>
                <span v-else class="team-page__member-link team-page__member-link--disabled" aria-disabled="true">
                  {{ t('mts_subordinate') }}
                  <Icon name="arrow" class="team-page__member-link-icon" />
                </span>
              </div>
              <div class="team-page__member-divider"></div>
              <div class="team-page__member-body">
                <div class="team-page__member-row">
                  <span class="team-page__member-label">{{ t('mts_reg_time') }}</span>
                  <span class="team-page__member-val">{{ formatCtime(item.ctime) }}</span>
                </div>
                <div class="team-page__member-row">
                  <span class="team-page__member-label">{{ t('mts_valid_user') }}</span>
                  <span class="team-page__member-val">{{
                    item.active === 1 ? t('ab_yes') : t('ab_no')
                    }}</span>
                </div>
                <div class="team-page__member-row">
                  <span class="team-page__member-label">{{ t('mts_team_count') }}</span>
                  <span class="team-page__member-val">
                    <CountTo :startVal="0" :endVal="Number(item.teamCount ?? 0)" :decimals="0" />
                  </span>
                </div>
                <template v-if="item.expanded">
                  <div class="team-page__member-row">
                    <span class="team-page__member-label">{{ t('mts_team_active_count') }}</span>
                    <span class="team-page__member-val">
                      <CountTo :startVal="0" :endVal="Number(item.teamActiveCount ?? 0)" :decimals="0" />
                    </span>
                  </div>
                  <div class="team-page__member-row">
                    <span class="team-page__member-label">{{ t('mts_my_invest') }}</span>
                    <span class="team-page__member-val">
                      <CountTo :startVal="0" :endVal="Number(item.myInvestAmount ?? 0)" :decimals="2" />
                    </span>
                  </div>
                  <div class="team-page__member-row">
                    <span class="team-page__member-label">{{ t('mts_team_invest') }}</span>
                    <span class="team-page__member-val">
                      <CountTo :startVal="0" :endVal="Number(item.teamInvestAmount ?? 0)" :decimals="2" />
                    </span>
                  </div>
                </template>
              </div>
              <div class="team-page__member-toggle" @click="toggleMemberExpand(i)">
                <span>{{ item.expanded ? t('mts_collapse') : t('mts_expand') }}</span>
                <Icon :name="item.expanded ? 'arrow-up' : 'arrow-down'" class="team-page__member-toggle-icon" />
              </div>
            </AppCard>
          </List>
        </PullRefresh>
      </div>
  
      <!-- 我的奖励 -->
      <div v-else class="team-page__content team-page__content--reward">
        <div class="team-page__reward-section">
          <div class="team-page__section-head team-page__section-head--inline">
            <span class="team-page__section-bar" aria-hidden="true"></span>
            <h3 class="team-page__section-title">{{ t('tp_vip_reward') }}</h3>
          </div>
          <span class="team-page__detail-link" @click="router.push({ name: 'VIPRewardDetail' })">{{
            t('tp_reward_detail')
            }}
            <Icon name="arrow" class="team-page__detail-link-icon" />
          </span>
        </div>
        <AppCard class="team-page__card team-page__card--reward">
          <div class="team-page__overview team-page__overview--reward">
            <div class="team-page__overview-item">
              <div class="team-page__num">{{ rewardInfo.vipAmount ?? 0 }}</div>
              <div class="team-page__label">{{ t('tp_total_reward') }}</div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__num">{{ rewardInfo.amount4 ?? 0 }}</div>
              <div class="team-page__label">{{ t('tp_level_reward') }}</div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__num">{{ rewardInfo.amount3 ?? 0 }}</div>
              <div class="team-page__label">{{ t('tp_peer_reward') }}</div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__num">{{ rewardInfo.amount2 ?? 0 }}</div>
              <div class="team-page__label">{{ t('tp_super_reward') }}</div>
            </div>
          </div>
        </AppCard>
  
        <div class="team-page__reward-section">
          <div class="team-page__section-head team-page__section-head--inline">
            <span class="team-page__section-bar" aria-hidden="true"></span>
            <h3 class="team-page__section-title">{{ t('tp_referral_reward') }}</h3>
          </div>
          <span class="team-page__detail-link" @click="router.push({ name: 'ReferralRewardDetail' })">{{
            t('tp_reward_detail') }}
            <Icon name="arrow" class="team-page__detail-link-icon" />
          </span>
        </div>
        <AppCard class="team-page__card team-page__card--reward">
          <div class="team-page__overview team-page__overview--referral">
            <div class="team-page__overview-item">
              <div class="team-page__num">
                <CountTo :startVal="0" :endVal="Number(rewardInfo.directActiveCount ?? 0)" :decimals="0" />
              </div>
              <div class="team-page__label">{{ t('tp_direct_active') }}</div>
            </div>
            <div class="team-page__overview-item">
              <div class="team-page__num">
                <CountTo :startVal="0" :endVal="Number(rewardInfo.amount1 ?? 0)" :decimals="2" />
              </div>
              <div class="team-page__label">{{ t('tp_total_reward') }}</div>
            </div>
          </div>
        </AppCard>
  
        <div class="team-page__section-head">
          <span class="team-page__section-bar" aria-hidden="true"></span>
          <span class="team-page__section-title">{{ t('tp_referral_desc') }}</span>
        </div>
        <AppCard class="team-page__card team-page__card--reward team-page__rule-card">
          <div class="team-page__rule">
            <p class="team-page__rule-line">{{ t('tp_rule_title') }}</p>
            <p class="team-page__rule-line">{{ t('tp_rule_line1') }}</p>
            <p class="team-page__rule-line">{{ t('tp_rule_line2') }}</p>
          </div>
        </AppCard>
  
        <div class="team-page__section-head">
          <span class="team-page__section-bar" aria-hidden="true"></span>
          <span class="team-page__section-title">{{ t('tp_ratio_title') }}</span>
        </div>
        <AppCard class="team-page__card team-page__card--table">
          <div class="team-page__table">
            <div class="team-page__table-row team-page__table-row--head">
              <span>{{ t('tp_ratio_direct_count') }}</span>
              <span>{{ t('tp_ratio_sub') }}</span>
              <span>{{ t('tp_ratio_rate') }}</span>
            </div>
            <div v-for="(row, i) in ratioTable" :key="i" class="team-page__table-row">
              <span>
                <CountTo :startVal="0" :endVal="Number(row.n) || 0" :decimals="0" />
              </span>
              <span>
                <CountTo :startVal="0" :endVal="Number(row.sub) || 0" :decimals="0" />
              </span>
              <span>
                <CountTo :startVal="0" :endVal="Number(row.ratio?.replace('%', '')) || 0" suffix="%" :decimals="0" />
              </span>
            </div>
          </div>
        </AppCard>
      </div>
    </PageWrap>
    <AppTabBar />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AvatarImg from '/@/assets/avatar.png';
import inviteGiftImg from '/@/assets/images/friends.png';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '/@/hooks/web/useMessage';
import teamLevelBadge1 from '/@/assets/images/Team/level-1.png';
import teamLevelBadge2 from '/@/assets/images/Team/level-2.png';
import teamLevelBadge3 from '/@/assets/images/Team/level-3.png';
import teamLevelBadge4 from '/@/assets/images/Team/level-4.png';
import teamLevelBadge5 from '/@/assets/images/Team/level-5.png';
import teamLevelBadge6 from '/@/assets/images/Team/level-6.png';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { getRewardInfo, type MyRewardVo } from '/@/service/Reward';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
import { Tabs, Tab, Button, Icon, PullRefresh, List, Popover } from 'vant';
import { ref, computed, watch, onMounted, onBeforeMount, onActivated } from 'vue';
import { NavBar, PageWrap, AppCard, AppTabBar, CountTo, InviteModal } from '/@/components';
import { getTeamInfo, getTeamChildren, type MyTeamVo, type TeamMemberVo } from '/@/service/Team';
import { isCapacitorNative } from '/@/utils/shareInviteImage';
import { emitEvent } from '/@/utils/eventBus';

/** 常量或静态配置：团队 */
const TEAM_LEVEL_BADGE_URLS = [
  teamLevelBadge1,
  teamLevelBadge2,
  teamLevelBadge3,
  teamLevelBadge4,
  teamLevelBadge5,
  teamLevelBadge6
] as const;

/** 团队：teamMemberLevelBadgeSrc */
const teamMemberLevelBadgeSrc = (level: TeamMemberVo['level']): string => {
  const n = Number.parseInt(String(level ?? '').trim(), 10);
  const idx = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 1;
  return TEAM_LEVEL_BADGE_URLS[idx - 1];
};

/** 从 useI18n 解构的文案与能力 */
const { t } = useI18n();


const Logo = computed(() => SystemStore.getSiteLogo);
/** 当前路由：读取 query、params、meta 等 */
const route = useRoute();

/** 路由实例：编程式导航 */
const router = useRouter();

/** Tab 状态：normalizeRouteTabQuery */
const normalizeRouteTabQuery = (tab: unknown): 'team' | 'reward' | null => {
  const t = Array.isArray(tab) ? tab[0] : tab;
  if (t === 'reward') return 'reward';
  if (t === 'team') return 'team';
  return null;
};

/** 用户：UserStore */
const UserStore = useUserStoreWithOut();

/** SystemStore */
const SystemStore = useSystemStoreWithOut();

/** 从 useMessage 解构的 Toast / Dialog 能力 */
const { CreateSuccessToast } = useMessage();

// URL 域名

/** 计算属性：由其它状态派生的展示或判断 */
const WebPath = computed(() => {
  return SystemStore.getWebPath;
});

/** 首屏必须与路由一致：onMounted 太晚，Vant Tabs 已按默认 team 完成初始化 */
const activeTab = ref<'team' | 'reward'>(normalizeRouteTabQuery(route.query.tab) ?? 'team');

/** 当前路由：applyTabFromRoute */
const applyTabFromRoute = () => {
  activeTab.value = normalizeRouteTabQuery(route.query.tab) ?? 'team';
};

/** 当前选中项：onTabsActiveUpdate */
const onTabsActiveUpdate = (v: string | number) => {
  if (v !== 'reward' && v !== 'team') return;
  activeTab.value = v;
  const currentTab = normalizeRouteTabQuery(route.query.tab) ?? 'team';
  if (currentTab === v) return;
  const query = { ...route.query };
  if (v === 'team') delete query.tab;
  else query.tab = 'reward';
  router.replace({ name: 'Team', query });
};

/** 响应式状态：显隐控制 */
const showEffectiveUserTipDirect = ref(false);

/** 响应式状态：显隐控制 */
const showEffectiveUserTipTeam = ref(false);

/** 侦听依赖变化并触发副作用 */
watch(showEffectiveUserTipDirect, (v) => {
  if (v) showEffectiveUserTipTeam.value = false;
});

/** 侦听依赖变化并触发副作用 */
watch(showEffectiveUserTipTeam, (v) => {
  if (v) showEffectiveUserTipDirect.value = false;
});

/** 下级列表请求 uid：直接使用 Pinia UserInfo */
const requestUid = computed(() => {
  const userInfo = (UserStore.getUserInfo ?? {}) as Record<string, unknown>;
  const uid = Number(userInfo.uid ?? userInfo.userId ?? userInfo.id);
  return Number.isFinite(uid) ? uid : 0;
});

// 团队信息（接口 POST /member/app/team/get）

/** 响应式状态：团队 */
const teamInfo = ref<MyTeamVo>({});

/** 响应式状态：inviteCode 相关 UI 或数据 */
const inviteCode = ref('');

/** 邀请链接：H5 用当前页域名；APP 内 WebView 用配置 WebPath，避免 origin 为 file/capacitor 等 */
const inviteLink = computed(() => {
  const code = teamInfo.value.myInviteCode || inviteCode.value;
  if (!code) return '';
  const encoded = encodeURIComponent(code);
  const path = `/Register?InviteCode=${encoded}`;
  if (isCapacitorNative()) {
    const base = (WebPath.value || '').replace(/\/+$/, '');
    if (base) return `${base}${path}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
    return path;
  }
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
});
// 下级成员列表（来自 POST /member/app/team/getChildren），每项带 expanded 控制展开

/** 响应式状态：列表数据 */
const teamList = ref<
  Array<
    TeamMemberVo & {
      expanded: boolean;
    }
  >
>([]);

/** 响应式状态：分页 */
const memberPageNo = ref(1);

/** 分页：memberPageSize */
const memberPageSize = 10;

/** 响应式状态：总条数 */
const memberTotal = ref(0);

/** 响应式状态：加载中状态 */
const memberLoading = ref(false);

/** 响应式状态：列表是否已全部加载 */
const memberFinished = ref(false);

/** 响应式状态：下拉刷新 */
const memberRefreshing = ref(false);
// 奖励比例表：优先使用接口 rebatSettingLevelList，无数据时用默认

/** 常量或静态配置：Tab 状态 */
const ratioTableDefault = [
  { n: '1', sub: '1', ratio: '10%' },
  { n: '3', sub: '2', ratio: '10%' },
  { n: '5', sub: '3', ratio: '10%' },
  { n: '7', sub: '4', ratio: '10%' },
  { n: '9', sub: '5', ratio: '10%' },
  { n: '11', sub: '6', ratio: '10%' },
  { n: '15', sub: '7', ratio: '10%' },
  { n: '20', sub: '8', ratio: '10%' }
];

/** 响应式状态：Tab 状态 */
const ratioTable = ref<
  Array<{
    n: string;
    sub: string;
    ratio: string;
  }>
>([...ratioTableDefault]);
/** 我的奖励信息（POST /member/app/reward/get），用于 VIP 与推荐奖励区块 */
const rewardInfo = ref<MyRewardVo>({});

/** 拉取接口数据：fetchTeamInfo */
const fetchTeamInfo = () => {
  getTeamInfo()
    .then((res) => {
      if (res?.code === 0 && res.data) {
        teamInfo.value = res.data;
        if (res.data.myInviteCode) inviteCode.value = res.data.myInviteCode;
      }
    })
    .catch(() => {
      teamInfo.value = {};
    });
};

/** 拉取接口数据：fetchRewardInfo */
const fetchRewardInfo = () => {
  getRewardInfo()
    .then((res) => {
      if (res?.code === 0 && res.data) {
        rewardInfo.value = res.data;
        const list = res.data.rebatSettingLevelList;
        if (list?.length) {
          ratioTable.value = list.map((item) => ({
            n: String(item.directCount ?? ''),
            sub: String(item.agentLevel ?? ''),
            ratio: item.rate != null ? `${item.rate}%` : '0%'
          }));
        }
      }
    })
    .catch(() => {
      rewardInfo.value = {};
    });
};

/** 拉取接口数据：fetchTeamChildren */
const fetchTeamChildren = (reset = false) => {
  if (memberLoading.value) return;
  if (reset) {
    memberPageNo.value = 1;
    memberFinished.value = false;
    teamList.value = [];
  }
  memberLoading.value = true;
  getTeamChildren({
    pageNo: memberPageNo.value,
    pageSize: memberPageSize,
    uid: requestUid.value,
    offset: 0
  })
    .then((res) => {
      if (res?.code === 0 && res.data) {
        const list = (res.data.list || []).map((m) => ({ ...m, expanded: false }));
        teamList.value = reset ? list : teamList.value.concat(list);
        const total = Number(res.data.total ?? 0);
        memberTotal.value = total;
        const mergedLen = teamList.value.length;
        // 有 total：已拉够条数即结束；无/为 0：本页不足一页表示没有下一页（避免 total=0 且每页满页时永远 memberFinished=false）
        memberFinished.value = (total > 0 && mergedLen >= total) || list.length < memberPageSize;
        if (!memberFinished.value) memberPageNo.value += 1;
      } else {
        memberFinished.value = true;
      }
    })
    .catch(() => {
      memberFinished.value = true;
    })
    .finally(() => {
      memberLoading.value = false;
      if (reset) memberRefreshing.value = false;
    });
};

/** 下拉刷新：onMemberRefresh */
const onMemberRefresh = () => {
  void fetchTeamChildren(true);
};

/** 拉取接口数据：onMemberLoad */
const onMemberLoad = () => {
  if (memberFinished.value || memberRefreshing.value || memberLoading.value) return;
  void fetchTeamChildren(false);
};

/** 切换展开/折叠等：toggleMemberExpand */
const toggleMemberExpand = (index: number) => {
  const item = teamList.value[index];
  if (item) item.expanded = !item.expanded;
};

/** 是否允许某操作：canDrillDownMember */
const canDrillDownMember = (item: TeamMemberVo) => {
  return Number(item.uid) > 0 && Number(item.teamCount ?? 0) > 1;
};

/** 页面跳转：goSubordinate */
const goSubordinate = (item: TeamMemberVo) => {
  if (!canDrillDownMember(item)) return;
  activeTab.value = 'team';
  router.replace({ name: 'Team', query: { ...route.query, tab: 'team' } });
  router.push({ name: 'MyTeamSub', query: { uid: String(item.uid) } });
};

/** 格式化展示：formatCtime */
const formatCtime = (ctime?: string) => {
  if (!ctime) return '-';
  const d = new Date(ctime);
  if (Number.isNaN(d.getTime())) return ctime;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

/** copyInviteCode */
const copyInviteCode = () => {
  const text = teamInfo.value.myInviteCode || inviteCode.value;
  navigator.clipboard?.writeText(text).then(() => CreateSuccessToast(t('tp_copied')));
};

/** copyInviteLink */
const copyInviteLink = () => {
  if (!inviteLink.value) return;
  navigator.clipboard?.writeText(inviteLink.value).then(() => CreateSuccessToast(t('tp_copied')));
};

/** 组件挂载后执行：初始化数据或订阅 */
onMounted(() => {
  applyTabFromRoute();
  void fetchTeamInfo();
  void fetchTeamChildren(true);
  void fetchRewardInfo();
});

/** 侦听依赖变化并触发副作用 */
watch(
  () => route.query.tab,
  () => {
    applyTabFromRoute();
  }
);
/** 若 Team 被 KeepAlive 包裹，返回时 onMounted 不执行，需在此同步 Tab */
onActivated(() => {
  applyTabFromRoute();
});
// 初始化
onBeforeMount((): void => {
  UserStore.setActiveTab(3);
});
</script>

<style scoped lang="less">
@primary-blue: #1A37FD;
@text-primary: #000;
@text-secondary: #333;
@text-muted: #999;
@card-bg: #F9FAFF;
@card-shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
@card-radius: 0.24rem;

.team-page-shell {
  min-height: 100vh;
  background: transparent;
}

.team-page {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  color: @text-primary;
}

.team-page__tabs {
  padding: 0 0.4rem;
  margin-top: 0.08rem;

  :deep(.van-tabs__wrap) {
    height: auto;
  }

  :deep(.van-tabs__nav--card) {
    margin: 0;
    border: 1px solid rgba(51, 102, 255, 0.18);
    border-radius: 10px;
    background: #EFF2FE;
    height: 0.76rem;
    padding: 0.06rem;
    box-sizing: border-box;
  }

  :deep(.van-tab--card) {
    border: none;
    background: transparent;
    color: #727794;
    font-size: 0.28rem;
    font-weight: 600;
    border-radius: 999px;
    line-height: 0.64rem;
    transition: box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
  }

  :deep(.van-tab--active) {
    background: #e3eaff !important;
    color: #1a37fd !important;
    font-weight: 700;
    box-shadow:
      inset 0 0 10px 0 #fff,
      0 2px 2px 0 rgba(26, 55, 253, 0.2);
  }
}

.team-page__content {
  padding: 0.24rem 0.32rem 0.32rem;
}

.team-page__section-head {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  margin: 0.28rem 0 0.3rem;

  &:first-child {
    margin-top: 0.12rem;
  }

  &--inline {
    margin: 0;
  }
}

.team-page__section-bar {
  width: 0.08rem;
  height: 0.28rem;
  border-radius: 0.04rem;
  background: linear-gradient(180deg, #6ca9ff 0%, @primary-blue 100%);
  flex-shrink: 0;
}

.team-page__section-title {
  font-size: 0.3rem;
  font-weight: 700;
  color: @text-primary;
  line-height: 1.2;
}

.team-page__card {
  padding: 0.28rem 0.3rem;
  margin-bottom: 0.3rem;
  border-radius: @card-radius;
  background: @card-bg !important;
  box-shadow: @card-shadow;
  border: none;
}

.team-page__card--overview {
  padding: 0.36rem 0.28rem 0.32rem;
  border-radius: 0.2rem;
}

.team-page__overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 0.08rem;
  row-gap: 0.36rem;
}

.team-page__overview-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;
}

.team-page__overview-icon {
  flex-shrink: 0;
  width: 0.44rem;
  height: 0.44rem;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.van-icon) {
    font-size: 0.4rem;
    line-height: 1;
    background: linear-gradient(180deg, #6ca9ff 0%, #3366ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

.team-page__overview-text {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.team-page__num {
  font-size: 0.3rem;
  font-weight: 700;
  color: @text-primary;
  line-height: 1.2;
  white-space: nowrap;
}

.team-page__label {
  font-size: 0.2rem;
  color: #888;
  margin-top: 0.04rem;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.04rem;
  line-height: 1.3;
  word-break: break-all;
}

.team-page__label-icon {
  font-size: 0.2rem;
  color: @primary-blue;
  cursor: pointer;
  flex-shrink: 0;
}

:deep(.team-page__effective-popover.van-popover--light) {
  --van-popover-light-background: #fff;
  --van-popover-light-text-color: @text-secondary;
}

.team-page__effective-tip {
  max-width: 4.8rem;
  padding: 0.2rem 0.24rem;
  font-size: 0.22rem;
  line-height: 1.5;
  color: @text-secondary;
  text-align: left;
  word-break: break-word;
  box-sizing: border-box;
}

.team-page__invite-card {
  padding: 0.32rem 0.28rem 0.36rem;
  border-radius: 0.4rem;
  overflow: visible;
}

.team-page__invite {
  display: flex;
  flex-direction: column;
}

.team-page__invite-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.16rem;
}

.team-page__invite-meta {
  font-size: 0.26rem;
  color: @text-secondary;
  font-weight: 500;
  white-space: nowrap;
}

.team-page__invite-divider {
  margin: 0.18rem 0 0.22rem;
  border-top: 1px dashed #dce3f5;
}

.team-page__invite-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1rem;
  margin-bottom: 0.28rem;
}

.team-page__invite-fields {
  flex: 1;
  min-width: 0;
  padding-right: 0.04rem;
}

.team-page__invite-gift {
  width: 2rem;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
  align-self: center;
  pointer-events: none;
}

.team-page__invite-line {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.2rem;
  margin-bottom: 0.16rem;
  font-size: 0.26rem;
  line-height: 1.45;

  &:last-child {
    margin-bottom: 0;
  }
}

.team-page__invite-line-label {
  flex-shrink: 0;
  color: #999;
  font-weight: 400;
  white-space: nowrap;
}

.team-page__invite-line-value {
  min-width: 0;
  color: @text-primary;
  font-weight: 600;
  word-break: break-all;
}

.team-page__invite-line-value--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-page__copy-icon {
  flex-shrink: 0;
  font-size: 0.3rem;
  color: @primary-blue;
  cursor: pointer;
}

.team-page__invite-btn {
  height: 0.84rem;
  font-size: 0.3rem;
  font-weight: 700;
  border: none;
  background: linear-gradient(180deg, #7699ff 0%, #4d76f1 100%) !important;
  box-shadow: 0 0.08rem 0.24rem rgba(77, 118, 241, 0.35);
}

.team-page__member-card {
  padding: 0;
  margin-bottom: 0.2rem;
  border-radius: @card-radius;
  overflow: hidden;
  background: @card-bg !important;
  box-shadow: @card-shadow;
}

.team-page__member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.24rem 0.28rem 0.2rem;
}

.team-page__member-title {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;
}

.team-page__member-avatar {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.team-page__member-id {
  font-size: 0.28rem;
  color: @text-primary;
  font-weight: 700;
  white-space: nowrap;
}

.team-page__member-crown {
  width: 0.34rem;
  height: 0.34rem;
  object-fit: contain;
  flex-shrink: 0;
}

.team-page__member-link {
  font-size: 0.26rem;
  color: @primary-blue;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.02rem;
  flex-shrink: 0;
}

.team-page__member-link-icon {
  font-size: 0.22rem;
  color: @primary-blue;
}

.team-page__member-link--disabled {
  color: #8c93a6;
  cursor: default;
  pointer-events: none;
  user-select: none;

  .team-page__member-link-icon {
    color: #c0c8d8;
  }
}

.team-page__member-divider {
  margin: 0 0.28rem;
  border-top: 1px dashed #e8ecf5;
}

.team-page__member-body {
  padding: 0.08rem 0.28rem 0.04rem;
  font-size: 0.24rem;
}

.team-page__member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.14rem 0;
  gap: 0.2rem;
}

.team-page__member-label {
  color: @text-muted;
  font-weight: 400;
  flex-shrink: 0;
}

.team-page__member-val {
  color: @text-primary;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}

.team-page__member-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
  padding: 0.18rem 0 0.22rem;
  font-size: 0.26rem;
  color: @text-primary;
  font-weight: 500;
  cursor: pointer;
}

.team-page__member-toggle-icon {
  font-size: 0.22rem;
  color: @text-muted;
}

:deep(.van-list__finished-text),
:deep(.van-list__loading) {
  color: @text-muted;
  font-size: 0.24rem;
  padding: 0.2rem 0;
}

.team-page__detail-link {
  font-size: 0.26rem;
  color: @primary-blue;
  display: inline-block;
  flex-shrink: 0;
  font-weight: 500;
}

.team-page__content--reward {
  padding-top: 0.12rem;
}

.team-page__content--reward .team-page__section-head:not(.team-page__section-head--inline) {
  margin: 0.18rem 0 0.14rem;
}

.team-page__reward-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
  margin-top: 0.24rem;
  gap: 0.16rem;

  &:first-child {
    margin-top: 0.08rem;
  }
}

.team-page__overview--reward,
.team-page__overview--referral {
  grid-template-columns: repeat(2, 1fr);
  column-gap: 0.2rem;
  row-gap: 0.22rem;

  .team-page__overview-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.06rem;
  }

  .team-page__num {
    white-space: nowrap;
  }

  .team-page__label {
    justify-content: center;
    margin-top: 0.02rem;
  }
}

.team-page__overview--referral {
  column-gap: 0.18rem;
  row-gap: 0.18rem;
}

.team-page__rule-card {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.team-page__rule {
  font-size: 0.22rem;
  color: #8c8c8c;
  line-height: 1.6;
  margin: 0;
}

.team-page__rule-line {
  margin: 0 0 0.12rem;
}

.team-page__rule-line:last-child {
  margin-bottom: 0;
}

.team-page__card--table {
  padding: 0;
  overflow: hidden;
}

.team-page__table {
  width: 100%;
}

.team-page__table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.18rem 0.24rem;
  font-size: 0.22rem;
  color: #6f7a90;
  text-align: center;
  background: transparent;
}

.team-page__table-row--head {
  font-weight: 700;
  color: #1a37fd;
  background: transparent;
  padding: 0.2rem 0.24rem;
  font-size: 0.23rem;
  border-bottom: 1px dashed #dbe6ff;
}

.team-page__table-row:not(.team-page__table-row--head) {
  background: transparent;
  border-bottom: none;
}

.team-page__table-row:not(.team-page__table-row--head):last-child {
  border-bottom: none;
}
</style>
