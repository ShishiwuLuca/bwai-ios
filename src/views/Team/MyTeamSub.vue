<template>
  <PageWrap class="team-sub-page">
    <NavBar :title="t('mts_title')" fixed placeholder :border="false" />
    <div class="team-sub-page__subtitle">{{ subtitle }}</div>
    <div class="team-sub-page__list">
      <PullRefresh v-model="refreshing" @refresh="onRefresh">
        <List
          :loading="loading"
          :finished="finished"
          :finished-text="t('mts_no_more')"
          :immediate-check="false"
          @load="onLoad"
        >
          <AppCard v-for="(item, i) in list" :key="item.uid ?? i" class="team-sub-page__card">
            <div class="team-sub-page__head">
              <span class="team-sub-page__head-title">
                {{ t('mts_user_id') }} {{ item.uid ?? '-' }}
                <img
                  :src="teamMemberLevelBadgeSrc(item.level)"
                  alt=""
                  class="team-sub-page__head-badge"
                />
              </span>
              <span
                v-if="canDrillDown(item)"
                class="team-sub-page__link"
                role="button"
                @click="goSubordinate(item)"
              >
                {{ t('mts_subordinate') }}
                <Icon name="arrow" class="team-sub-page__link-icon" size="15" color="#fff" />
              </span>
              <span
                v-else
                class="team-sub-page__link team-sub-page__link--disabled"
                aria-disabled="true"
              >
                {{ t('mts_subordinate') }}
                <Icon
                  name="arrow"
                  class="team-sub-page__link-icon"
                  size="15"
                  color="rgba(255,255,255,0.35)"
                />
              </span>
            </div>

            <div class="team-sub-page__body">
              <div class="team-sub-page__row">
                <span class="team-sub-page__label">{{ t('mts_reg_time') }}</span>
                <span class="team-sub-page__value">{{ formatCtime(item.ctime) }}</span>
              </div>
              <div class="team-sub-page__row">
                <span class="team-sub-page__label">{{ t('mts_valid_user') }}</span>
                <span class="team-sub-page__value">{{
                  item.active === 1 ? t('ab_yes') : t('ab_no')
                }}</span>
              </div>
              <div class="team-sub-page__row">
                <span class="team-sub-page__label">{{ t('mts_team_count') }}</span>
                <span class="team-sub-page__value">{{ item.teamCount ?? 0 }}</span>
              </div>

              <template v-if="item.expanded">
                <div class="team-sub-page__row">
                  <span class="team-sub-page__label">{{ t('mts_team_active_count') }}</span>
                  <span class="team-sub-page__value">{{ item.teamActiveCount ?? 0 }}</span>
                </div>
                <div class="team-sub-page__row">
                  <span class="team-sub-page__label">{{ t('mts_my_invest') }}</span>
                  <span class="team-sub-page__value">{{ item.myInvestAmount ?? 0 }}</span>
                </div>
                <div class="team-sub-page__row">
                  <span class="team-sub-page__label">{{ t('mts_team_invest') }}</span>
                  <span class="team-sub-page__value">{{ item.teamInvestAmount ?? 0 }}</span>
                </div>
              </template>
            </div>

            <div class="team-sub-page__toggle" @click="toggleExpand(i)">
              <span class="mr-.5">{{ item.expanded ? t('mts_collapse') : t('mts_expand') }}</span>
              <Icon
                :name="item.expanded ? 'arrow-up' : 'arrow-down'"
                class="team-sub-page__toggle-icon"
              />
            </div>
          </AppCard>
        </List>
      </PullRefresh>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import { NavBar, PageWrap, AppCard } from '/@/components';
  import { PullRefresh, List, Icon } from 'vant';
  import teamLevelBadge1 from '/@/assets/images/Team/level-1.png';
  import teamLevelBadge2 from '/@/assets/images/Team/level-2.png';
  import teamLevelBadge3 from '/@/assets/images/Team/level-3.png';
  import teamLevelBadge4 from '/@/assets/images/Team/level-4.png';
  import teamLevelBadge5 from '/@/assets/images/Team/level-5.png';
  import teamLevelBadge6 from '/@/assets/images/Team/level-6.png';
  import { getTeamChildren, type TeamMemberVo } from '/@/service/Team';

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

  /** 当前路由：读取 query、params、meta 等 */
  const route = useRoute();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 当前查询 uid：来自路由 query.uid，无则传 0 */
  const routeUid = computed(() => {
    const raw = route.query.uid;
    const val = Array.isArray(raw) ? raw[0] : raw;
    const uid = Number(val);
    return Number.isFinite(uid) ? uid : 0;
  });

  /** 计算属性：副标题 */
  const subtitle = computed(() =>
    routeUid.value > 0 ? t('mts_subtitle_uid_team', [routeUid.value]) : t('mts_my_team')
  );

  /** 响应式状态：列表数据 */
  const list = ref<
    Array<
      TeamMemberVo & {
        expanded: boolean;
      }
    >
  >([]);

  /** 响应式状态：分页 */
  const pageNo = ref(1);

  /** 分页：pageSize */
  const pageSize = 10;

  /** 响应式状态：总条数 */
  const total = ref(0);

  /** 响应式状态：加载中状态 */
  const loading = ref(false);

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref(false);

  /** 响应式状态：下拉刷新 */
  const refreshing = ref(false);

  /** 拉取接口数据：fetchChildren */
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
          // 与 Team.vue 一致：有 total 则按条数收齐；无/为 0 则本页不足一页视为最后一页（避免 total=0 且每页满页时永远 finished=false）
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

  /** 下拉刷新：onRefresh */
  const onRefresh = () => {
    void fetchChildren(true);
  };

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    if (finished.value || refreshing.value || loading.value) return;
    void fetchChildren(false);
  };

  /** 切换展开/折叠等：toggleExpand */
  const toggleExpand = (index: number) => {
    const item = list.value[index];
    if (item) item.expanded = !item.expanded;
  };

  /** 是否允许某操作：canDrillDown */
  const canDrillDown = (item: TeamMemberVo) => {
    return Number(item.uid) > 0 && Number(item.teamCount ?? 0) > 1;
  };

  /** 页面跳转：goSubordinate */
  const goSubordinate = (item: TeamMemberVo) => {
    if (!canDrillDown(item)) return;
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

  /** 组件挂载后执行：初始化数据或订阅 */
  onMounted(() => {
    void fetchChildren(true);
  });

  /** 监听 uid 变化：进入下一级后自动按新 uid 重新拉取第一页 */
  watch(
    () => routeUid.value,
    () => {
      void fetchChildren(true);
    }
  );
</script>

<style scoped lang="less">
  .team-sub-page {
    min-height: 100vh;
    color: #fff;
    background: #0f1424;
  }

  .team-sub-page__subtitle {
    padding: 0.24rem 0.32rem;
    font-size: 0.28rem;
    font-weight: 700;
  }

  .team-sub-page__list {
    padding: 0 0.32rem;
  }

  .team-sub-page__card {
    padding: 0;
    margin-bottom: 0.2rem;
    border-radius: 0.24rem;
    overflow: hidden;
    background: #141d3f;
  }

  .team-sub-page__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.24rem 0.28rem;
    background: linear-gradient(90deg, #006ed2 0%, #012688 100%);
  }

  .team-sub-page__head-title {
    display: inline-flex;
    align-items: center;
    gap: 0.12rem;
    font-size: 0.3rem;
    font-weight: 700;
  }

  .team-sub-page__head-badge {
    width: 0.36rem;
    height: 0.36rem;
    object-fit: contain;
    flex-shrink: 0;
  }

  .team-sub-page__body {
    padding: 0.18rem 0.28rem 0.12rem;
  }

  .team-sub-page__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.11rem 0;
  }

  .team-sub-page__label {
    font-size: 0.26rem;
    color: rgba(255, 255, 255, 0.76);
  }

  .team-sub-page__value {
    font-size: 0.3rem;
    color: rgba(255, 255, 255, 0.96);
    font-weight: 600;
  }

  .team-sub-page__link {
    color: #fff;
    font-size: 0.28rem;
  }

  .team-sub-page__link--disabled {
    color: rgba(255, 255, 255, 0.45);
    cursor: default;
    pointer-events: none;
    user-select: none;
  }

  .team-sub-page__toggle {
    text-align: center;
    padding: 0.16rem 0;
    font-size: 0.28rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .team-sub-page__nomore {
    text-align: center;
    font-size: 0.24rem;
    opacity: 0.7;
  }
</style>
