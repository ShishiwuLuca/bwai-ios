<template>
  <div class="team-sub-page-shell">
    <PageWrap class="team-sub-page">
      <NavBar
        :title="t('mts_title')"
        left-arrow
        fixed
        placeholder
        :border="false"
        @click-left="onBack"
      />

      <div class="team-sub-page__body">
        <div class="team-sub-page__section-head">
          <span class="team-sub-page__section-bar" aria-hidden="true"></span>
          <span class="team-sub-page__section-title">{{ subtitle }}</span>
        </div>

        <PullRefresh v-model="refreshing" @refresh="onRefresh">
          <List
            :loading="loading"
            :finished="finished"
            :finished-text="t('mts_no_more')"
            :immediate-check="false"
            @load="onLoad"
          >
            <AppCard
              v-for="(item, i) in list"
              :key="item.uid ?? i"
              class="team-sub-page__member-card"
            >
              <div class="team-sub-page__member-head">
                <span class="team-sub-page__member-title">
                  <img :src="AvatarImg" alt="" class="team-sub-page__member-avatar" />
                  <span class="team-sub-page__member-id">{{ t('mts_user_id') }} {{ item.uid ?? '-' }}</span>
                  <img
                    :src="teamMemberLevelBadgeSrc(item.level)"
                    alt=""
                    class="team-sub-page__member-crown"
                  />
                </span>
                <span
                  v-if="canDrillDown(item)"
                  class="team-sub-page__member-link"
                  role="button"
                  @click="goSubordinate(item)"
                >
                  {{ t('mts_subordinate') }}
                  <Icon name="arrow" class="team-sub-page__member-link-icon" />
                </span>
                <span
                  v-else
                  class="team-sub-page__member-link team-sub-page__member-link--disabled"
                  aria-disabled="true"
                >
                  {{ t('mts_subordinate') }}
                  <Icon name="arrow" class="team-sub-page__member-link-icon" />
                </span>
              </div>

              <div class="team-sub-page__member-divider"></div>

              <div class="team-sub-page__member-body">
                <div class="team-sub-page__member-row">
                  <span class="team-sub-page__member-label">{{ t('mts_reg_time') }}</span>
                  <span class="team-sub-page__member-val">{{ formatCtime(item.ctime) }}</span>
                </div>
                <div class="team-sub-page__member-row">
                  <span class="team-sub-page__member-label">{{ t('mts_valid_user') }}</span>
                  <span class="team-sub-page__member-val">{{
                    item.active === 1 ? t('ab_yes') : t('ab_no')
                  }}</span>
                </div>
                <div class="team-sub-page__member-row">
                  <span class="team-sub-page__member-label">{{ t('mts_team_count') }}</span>
                  <span class="team-sub-page__member-val">
                    <CountTo :start-val="0" :end-val="Number(item.teamCount ?? 0)" :decimals="0" />
                  </span>
                </div>

                <template v-if="item.expanded">
                  <div class="team-sub-page__member-row">
                    <span class="team-sub-page__member-label">{{ t('mts_team_active_count') }}</span>
                    <span class="team-sub-page__member-val">
                      <CountTo
                        :start-val="0"
                        :end-val="Number(item.teamActiveCount ?? 0)"
                        :decimals="0"
                      />
                    </span>
                  </div>
                  <div class="team-sub-page__member-row">
                    <span class="team-sub-page__member-label">{{ t('mts_my_invest') }}</span>
                    <span class="team-sub-page__member-val">
                      <CountTo
                        :start-val="0"
                        :end-val="Number(item.myInvestAmount ?? 0)"
                        :decimals="2"
                      />
                    </span>
                  </div>
                  <div class="team-sub-page__member-row">
                    <span class="team-sub-page__member-label">{{ t('mts_team_invest') }}</span>
                    <span class="team-sub-page__member-val">
                      <CountTo
                        :start-val="0"
                        :end-val="Number(item.teamInvestAmount ?? 0)"
                        :decimals="2"
                      />
                    </span>
                  </div>
                </template>
              </div>

              <div class="team-sub-page__member-toggle" @click="toggleExpand(i)">
                <span>{{ item.expanded ? t('mts_collapse') : t('mts_expand') }}</span>
                <Icon
                  :name="item.expanded ? 'arrow-up' : 'arrow-down'"
                  class="team-sub-page__member-toggle-icon"
                />
              </div>
            </AppCard>
          </List>
        </PullRefresh>
      </div>
    </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard, CountTo } from '/@/components';
  import { PullRefresh, List, Icon } from 'vant';
  import { useI18n } from '/@/hooks/web/useI18n';
  import AvatarImg from '/@/assets/avatar.png';
  import teamLevelBadge1 from '/@/assets/images/Team/level-1.png';
  import teamLevelBadge2 from '/@/assets/images/Team/level-2.png';
  import teamLevelBadge3 from '/@/assets/images/Team/level-3.png';
  import teamLevelBadge4 from '/@/assets/images/Team/level-4.png';
  import teamLevelBadge5 from '/@/assets/images/Team/level-5.png';
  import teamLevelBadge6 from '/@/assets/images/Team/level-6.png';
  import { getTeamChildren, type TeamMemberVo } from '/@/service/Team';

  const TEAM_LEVEL_BADGE_URLS = [
    teamLevelBadge1,
    teamLevelBadge2,
    teamLevelBadge3,
    teamLevelBadge4,
    teamLevelBadge5,
    teamLevelBadge6
  ] as const;

  const teamMemberLevelBadgeSrc = (level: TeamMemberVo['level']): string => {
    const n = Number.parseInt(String(level ?? '').trim(), 10);
    const idx = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 1;
    return TEAM_LEVEL_BADGE_URLS[idx - 1];
  };

  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();

  const routeUid = computed(() => {
    const raw = route.query.uid;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const uid = Number(val);
    return Number.isFinite(uid) ? uid : 0;
  });

  const subtitle = computed(() =>
    routeUid.value > 0 ? t('mts_subtitle_uid_team', [routeUid.value]) : t('mts_my_team')
  );

  const list = ref<Array<TeamMemberVo & { expanded: boolean }>>([]);
  const pageNo = ref(1);
  const pageSize = 10;
  const total = ref(0);
  const loading = ref(false);
  const finished = ref(false);
  const refreshing = ref(false);

  const fetchChildren = (reset = false) => {
    if (reset) {
      pageNo.value = 1;
      finished.value = false;
      list.value = [];
      loading.value = false;
    }
    if (loading.value) return;
    loading.value = true;
    getTeamChildren({
      pageNo: pageNo.value,
      pageSize,
      uid: routeUid.value || 0,
      offset: 0
    })
      .then((res) => {
        if (res?.code === 0 && res.data) {
          const rows = (res.data.list || []).map((item) => ({ ...item, expanded: false }));
          list.value = reset ? rows : list.value.concat(rows);
          const totalNum = Number(res.data.total ?? 0);
          total.value = totalNum;
          const mergedLen = list.value.length;
          finished.value = (totalNum > 0 && mergedLen >= totalNum) || rows.length < pageSize;
          if (!finished.value) pageNo.value += 1;
        } else {
          finished.value = true;
        }
      })
      .catch(() => {
        finished.value = true;
      })
      .finally(() => {
        loading.value = false;
        if (reset) refreshing.value = false;
      });
  };

  const onRefresh = () => {
    void fetchChildren(true);
  };

  const onLoad = () => {
    if (finished.value || refreshing.value || loading.value) return;
    void fetchChildren(false);
  };

  const toggleExpand = (index: number) => {
    const item = list.value[index];
    if (item) item.expanded = !item.expanded;
  };

  const canDrillDown = (item: TeamMemberVo) => {
    return Number(item.uid) > 0 && Number(item.teamCount ?? 0) > 1;
  };

  const goSubordinate = (item: TeamMemberVo) => {
    if (!canDrillDown(item)) return;
    router.push({ name: 'MyTeamSub', query: { uid: String(item.uid) } });
  };

  /** 返回 Team 时固定落在「我的团队」Tab，避免历史 URL 仍带 tab=reward */
  const onBack = () => {
    const back = (router.options.history.state as { back?: string | null })?.back;
    if (typeof back === 'string') {
      const path = back.split('?')[0].replace(/\/+$/, '') || '/';
      if (path === '/Team') {
        router.replace({ name: 'Team', query: { tab: 'team' } });
        return;
      }
    }
    router.back();
  };

  const formatCtime = (ctime?: string) => {
    if (!ctime) return '-';
    const d = new Date(ctime);
    if (Number.isNaN(d.getTime())) return ctime;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  };

  onMounted(() => {
    void fetchChildren(true);
  });

  watch(
    () => routeUid.value,
    () => {
      void fetchChildren(true);
    }
  );
</script>

<style scoped lang="less">
  @primary-blue: #1a37fd;
  @page-bg: #eef2fd;
  @text-primary: #000;
  @text-muted: #999;
  @card-bg: #f9faff;
  @card-shadow: 0 0.04rem 0.2rem rgba(51, 102, 255, 0.08);
  @card-radius: 0.24rem;

  .team-sub-page-shell {
    min-height: 100vh;
    background: transparent;
    color: @text-primary;
    --van-card-background: @card-bg;
    --van-cell-background: @card-bg;
    --van-text-color: @text-primary;
    --van-text-color-2: @text-muted;
    --van-background: @page-bg;
    --van-background-2: @card-bg;
    --van-border-color: #e8ecf5;
  }

  .team-sub-page {
    min-height: 100vh;
    padding-bottom: calc(0.32rem + env(safe-area-inset-bottom));
    color: @text-primary;
  }

  .team-sub-page :deep(.page-wrap) {
    background: transparent;
    color: @text-primary;
  }

  .team-sub-page :deep(.van-nav-bar),
  .team-sub-page :deep(.van-nav-bar__placeholder) {
    background: transparent !important;
  }

  .team-sub-page :deep(.van-nav-bar__title) {
    color: @text-primary;
    font-weight: 700;
    font-size: 0.34rem;
  }

  .team-sub-page :deep(.nav-back-button .van-icon),
  .team-sub-page :deep(.van-nav-bar .van-icon) {
    color: @text-primary !important;
  }

  .team-sub-page__body {
    padding: 0.16rem 0.32rem 0.32rem;
  }

  .team-sub-page__section-head {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    margin: 0.08rem 0 0.24rem;
  }

  .team-sub-page__section-bar {
    width: 0.08rem;
    height: 0.28rem;
    border-radius: 0.04rem;
    background: linear-gradient(180deg, #6ca9ff 0%, @primary-blue 100%);
    flex-shrink: 0;
  }

  .team-sub-page__section-title {
    font-size: 0.3rem;
    font-weight: 700;
    color: @text-primary;
    line-height: 1.2;
  }

  .team-sub-page__member-card {
    padding: 0;
    margin-bottom: 0.2rem;
    border-radius: @card-radius;
    overflow: hidden;
    background: @card-bg !important;
    box-shadow: @card-shadow;
  }

  .team-sub-page__member-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.24rem 0.28rem 0.2rem;
  }

  .team-sub-page__member-title {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    min-width: 0;
  }

  .team-sub-page__member-avatar {
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .team-sub-page__member-id {
    font-size: 0.28rem;
    color: @text-primary;
    font-weight: 700;
    white-space: nowrap;
  }

  .team-sub-page__member-crown {
    width: 0.34rem;
    height: 0.34rem;
    object-fit: contain;
    flex-shrink: 0;
  }

  .team-sub-page__member-link {
    font-size: 0.26rem;
    color: @primary-blue;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.02rem;
    flex-shrink: 0;
  }

  .team-sub-page__member-link-icon {
    font-size: 0.22rem;
    color: @primary-blue;
  }

  .team-sub-page__member-link--disabled {
    color: #b8c4e8;
    cursor: default;
    pointer-events: none;
    user-select: none;

    .team-sub-page__member-link-icon {
      color: #b8c4e8;
    }
  }

  .team-sub-page__member-divider {
    margin: 0 0.28rem;
    border-top: 1px dashed #e8ecf5;
  }

  .team-sub-page__member-body {
    padding: 0.08rem 0.28rem 0.04rem;
    font-size: 0.24rem;
  }

  .team-sub-page__member-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.14rem 0;
    gap: 0.2rem;
  }

  .team-sub-page__member-label {
    color: @text-muted;
    font-weight: 400;
    flex-shrink: 0;
  }

  .team-sub-page__member-val {
    color: @text-primary;
    font-weight: 600;
    text-align: right;
    word-break: break-all;
  }

  .team-sub-page__member-toggle {
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

  .team-sub-page__member-toggle-icon {
    font-size: 0.22rem;
    color: @text-muted;
  }

  :deep(.van-list__finished-text),
  :deep(.van-list__loading) {
    color: @text-muted;
    font-size: 0.24rem;
    padding: 0.2rem 0;
  }
</style>
