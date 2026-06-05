<template>
  <NavBar :title="t('team_rights_title')" fixed placeholder :border="false" />
  <PageWrap>
    <PullRefresh
      v-model="refreshing"
      class="!overflow-auto"
      :style="{ height: 'calc(100vh - var(--van-nav-bar-height))' }"
      @refresh="onRefresh"
    >
      <List v-model:loading="loading" :finished="finished" @load="onLoad">
        <template #finished>
          <Empty
            v-if="teamRewardCards.length < 1"
            image="search"
            :description="t('no_more')"
            class="bg-transparent pt-4"
          />
          <span v-else>{{ t('no_more') }}</span>
        </template>
        <div v-if="teamRewardCards.length > 0" class="p-[0.32rem] pb-[0.48rem]">
          <div
            v-for="item in teamRewardCards"
            :key="item.level"
            class="box-border mb-[0.32rem] border border-solid border-transparent rounded-[0.24rem] bg-[#141b3a] px-[0.32rem] pb-[0.32rem] pt-[0.36rem] last:mb-0"
            :class="isLevelUnlocked(item.level) ? '!border-[#f3e3ad]' : ''"
          >
            <div class="flex items-start gap-[0.24rem]">
              <VanImage
                :src="VipBadge"
                fit="contain"
                class="h-[1.4rem] w-[1.4rem] shrink-0 [&_.van-image__img]:!h-full [&_.van-image__img]:!w-full [&_.van-image__img]:object-contain"
              />
              <div class="min-w-0 flex-1 pt-[0.04rem]">
                <div class="text-[0.3rem] font-bold leading-[1.2] !text-[#EDD59C]"
                  >VIP {{ item.level }}</div
                >
                <div
                  class="mt-[0.14rem] box-border inline-block max-w-full bg-[#10c469] py-[0.08rem] pl-[0.14rem] pr-[0.36rem] text-[0.22rem] font-semibold leading-[1.2] text-white [clip-path:polygon(0_0,calc(100%-0.18rem)_0,100%_50%,calc(100%-0.18rem)_100%,0_100%)]"
                >
                  {{ t('team_rights_title') }}
                </div>
              </div>
              <VanImage
                :src="isLevelUnlocked(item.level) ? UnlockIcon : LockIcon"
                fit="contain"
                class="mt-[0.02rem] h-[0.44rem] w-[0.44rem] shrink-0 [&_.van-image__img]:!h-full [&_.van-image__img]:!w-full [&_.van-image__img]:object-contain"
                :class="
                  isLevelUnlocked(item.level) ? '' : 'opacity-[0.85] [filter:grayscale(0.25)]'
                "
              />
            </div>
            <div class="pt-[0.24rem] text-[0.26rem] leading-[1.45] text-white">
              <div>{{ t('team_condition_1', [formatInt(item.fundAmount)]) }}</div>
              <div class="mt-[0.12rem]">{{
                t('team_condition_2', [formatNum(item.pointSum)])
              }}</div>
              <div class="mt-[0.12rem]">
                {{
                  t('team_benefit_1', [
                    formatNum(item.jrate),
                    formatNum(item.erate),
                    formatNum(item.brate)
                  ])
                }}
              </div>
            </div>
          </div>
        </div>
      </List>
      <BackTop :offset="20" :right="10" :bottom="70" />
    </PullRefresh>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { computed, ref } from 'vue';
  import VipBadge from '/@/assets/images/vip.png';
  import LockIcon from '/@/assets/images/lock.png';
  import { NavBar, PageWrap } from '/@/components';
  import UnlockIcon from '/@/assets/images/unlock.png';
  import { getTeamRewardConfig } from '/@/service/Team';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import {
    buildTeamRewardCardsFromPayload,
    getUserVipLevel,

    /** TeamRewardCard：类型别名 */
    type TeamRewardCard
  } from '/@/utils/teamRewardLevelConfig';
  import { PullRefresh, List, Empty, BackTop, Image as VanImage } from 'vant';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  // 会员信息

  /** 计算属性：用户 */
  const userInfo = computed(() => {
    return UserStore.getUserInfo;
  });

  /** 接口归一化后的等级列表，按 level 升序 */
  const teamRewardCards = ref<TeamRewardCard[]>([]);

  // 下拉刷新状态

  /** 响应式状态：下拉刷新 */
  const refreshing = ref<boolean>(false);

  // 上啦加载状态（与 van-list 联动）

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 是否已加载完所有数据（本页配置为一次性拉全表，成功后恒为 true）

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref<boolean>(false);

  /** 用户等级 ≥ 卡片等级且已登录有等级时视为已解锁 */
  const isLevelUnlocked = (cardLevel: number): boolean => {
    /** u */
    const u = getUserVipLevel(userInfo.value as Record<string, unknown>);
    return u > 0 && u >= cardLevel;
  };

  /** 整数千分位展示（团队投资总额等） */
  const formatInt = (v: number): string => {
    if (!Number.isFinite(v)) return '0';
    return Math.round(v).toLocaleString();
  };

  /** 数值展示：整数直接转字符串，小数最多四位并去尾零 */
  const formatNum = (v: number): string => {
    if (!Number.isFinite(v)) return '0';
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(4).replace(/\.?0+$/, '');
  };

  // 下拉刷新事件：允许列表再次触发检测，重新拉取配置

  /** 下拉刷新：onRefresh */
  const onRefresh = (): void => {
    finished.value = false;
    getTeamRewardConfigData();
  };

  // 上啦加载更多事件：首屏与后续均由 List 触发，此处拉全量配置

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    loading.value = true;
    getTeamRewardConfigData();
  };

  /**
   * 获取团队奖励等级配置（POST /member/app/reward/getTeamRewardLevelSetting）
   * 成功：去重按 level 排序写入 teamRewardCards；失败或异常：清空列表
   * 关闭 loading / 结束刷新与 NoticeList 一致延迟 500ms
   */
  const getTeamRewardConfigData = (): void => {
    getTeamRewardConfig()
      .then((res) => {
        const { code, data } = res;
        if (Number(code) === 0) {
          teamRewardCards.value = buildTeamRewardCardsFromPayload(data);

          finished.value = true;
        } else {
          teamRewardCards.value = [];
          finished.value = true;
        }

        setTimeout(() => {
          refreshing.value = false;
          loading.value = false;
        }, 500);
      })
      .catch(() => {
        teamRewardCards.value = [];
        finished.value = true;
        setTimeout(() => {
          refreshing.value = false;
          loading.value = false;
        }, 500);
      });
  };
</script>
