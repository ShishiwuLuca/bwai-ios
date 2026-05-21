<template>
  <NavBar :title="t('notice_list_title')" fixed placeholder :border="false" />
  <PageWrap class="notice-list-page">
    <Tabs v-model:active="ActiveNoticeType" shrink :line-height="0" :animated="!isRTL" swipeable>
      <Tab
        :show-zero-badge="false"
        v-for="(item, index) in NoticeTypeList"
        :key="index"
        :name="index"
        :title="item.label"
        :badge="item.badge"
      >
        <PullRefresh
          v-model="refreshing"
          @refresh="onRefresh"
          class="!overflow-auto"
          :style="{ height: 'calc(100vh - var(--van-nav-bar-height) - 50px)' }"
        >
          <List v-model:loading="loading" :finished="finished" @load="onLoad">
            <template #finished>
              <Empty v-if="item.children.length < 1" image="search" :description="t('no_more')" />
              <span v-else>{{ t('no_more') }}</span>
            </template>
            <AppCardLinear
              v-for="(child, keys) in item.children"
              :key="keys"
              class="m-1 border-1 border-solid border-[var(--van-border-color)]"
            >
              <Cell
                v-if="ActiveNoticeType === 0"
                center
                clickable
                :border="false"
                :title="child.title"
                title-class="!text-[0.31rem]"
                class="!bg-transparent"
              >
                <template #value>
                  <template v-if="ActiveNoticeType === 0">
                    <Badge position="top-left" :dot="!child.isRead" />
                  </template>
                  <template v-else>
                    <Badge position="top-right" :dot="!child.isRead" :offset="[-5, 4]">
                      <div class="text-[0.25rem]">{{ TimeToFormat(child.publishTime) }}</div>
                    </Badge>
                  </template>
                </template>
              </Cell>
              <div class="p-1" :class="{ '!pl-1': ActiveNoticeType === 1 }">
                <template v-if="ActiveNoticeType === 0">
                  <div
                    class="text-[0.27rem] text-gray-500 h-2 overflow-hidden"
                    v-html="child.content"
                  ></div>
                  <Divider dashed class="!mt-0.5 !mb-0.5" />
                  <div class="flex items-center justify-between">
                    <div class="text-[0.27rem] flex-auto">{{
                      TimeToFormat(child.publishTime)
                    }}</div>
                    <Cell
                      class="rounded-sm !p-0.5 !w-7 overflow-hidden"
                      center
                      clickable
                      :border="false"
                      :title="t('notice_detail_button_title')"
                      title-class="!text-[0.27rem]"
                      is-link
                      @click="goDetail(child)"
                    />
                  </div>
                </template>
                <div
                  v-else
                  class="text-[0.27rem] text-gray-500 h-2 overflow-hidden"
                  v-html="child.messageContent"
                >
                </div>
              </div>
            </AppCardLinear>
          </List>
          <BackTop :offset="20" :right="10" :bottom="70" />
        </PullRefresh>
      </Tab>
    </Tabs>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { AppCardLinear } from '/@/components';
  import { NavBar, PageWrap } from '/@/components';
  import { TimeToFormat } from '/@/utils/TimeZone';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { ref, computed, onBeforeMount, watch } from 'vue';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
  import { Tab, Tabs, Cell, Badge, Divider, PullRefresh, List, Empty, BackTop } from 'vant';
  import { syncAppIconBadgeWithUnreadCount } from '/@/utils/appIconBadge';
  import { applyAppIconBadgeFromMessageUnreadCount } from '/@/utils/appNativeNotify';
  import {
    getNoticePage,
    getMyMessage,
    updateMessageReadStatus,
    getMyMessageUnreadCount,
    updateNoticeReadStatus
  } from '/@/service/Notice';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  // 选中类型

  /** 响应式状态：当前选中项 */
  const ActiveNoticeType = ref<number>(0);

  // 下拉刷新状态

  /** 响应式状态：下拉刷新 */
  const refreshing = ref<boolean>(false);

  // 上啦加载状态

  /** 响应式状态：加载中状态 */
  const loading = ref<boolean>(false);

  // 是否已加载完所有数据

  /** 响应式状态：列表是否已全部加载 */
  const finished = ref<boolean>(false);

  // 查询参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>({
    pageNo: 1,
    pageSize: 20
  });

  // 消息类型列表

  /** 响应式状态：列表数据 */
  const NoticeTypeList = ref<any[]>([
    {
      label: t('str_platform_notice'),
      badge: 0,
      children: []
    },
    {
      label: t('str_my_message'),
      badge: 0,
      children: []
    }
  ]);

  // 是否为倒置

  /** 计算属性：由其它状态派生的展示或判断 */
  const isRTL = computed(() => {
    return SystemStore.localInfo.isRTL;
  });

  // 监听Tab切换

  /** 侦听依赖变化并触发副作用 */
  watch(ActiveNoticeType, (newVal: number) => {
    inputParams.value.pageNo = 1;
    if (newVal === 0) {
      getNoticeList();
    } else {
      getMyMessageData();
    }
  });

  // 下拉刷新事件

  /** 下拉刷新：onRefresh */
  const onRefresh = (): void => {
    inputParams.value.pageNo = 1;
    // 清空列表数据
    finished.value = false;
    // 如果是平台消息
    if (ActiveNoticeType.value === 0) {
      getNoticeList();
    } else {
      getMyMessageData();
    }
  };

  // 上啦加载更多事件

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    loading.value = true;

    inputParams.value.pageNo++;

    // 如果是平台消息
    if (ActiveNoticeType.value === 0) {
      getNoticeList(true);
    } else {
      getMyMessageData(true);
    }
  };

  /** 跳转公告详情 */
  const goDetail = (child: any) => {
    // 保存公告内容
    UserStore.setNoticeContent(child);
    router.push('/Notice/Detail');
  };

  /** 获取公告列表 */
  const getNoticeList = (type?: boolean): void => {
    getNoticePage(inputParams.value).then((res) => {
      const {
        code,
        data: { list }
      } = res;
      if (Number(code) === 0) {
        if (list.length > 0) {
          // 如果是刷新
          if (!type) {
            NoticeTypeList.value[ActiveNoticeType.value].children = list;
          } else {
            // 加载更多
            NoticeTypeList.value[ActiveNoticeType.value].children = [
              ...NoticeTypeList.value[ActiveNoticeType.value].children,
              ...list
            ];
          }

          // 更新消息为已读
          updateNoticeReadStatusData();
        }

        // 如果返回的数据条数与分页的一致则允许加载更多
        if (list.length < inputParams.value.pageSize) {
          finished.value = true;
        }

        // 延迟关闭
        setTimeout(() => {
          // 关闭刷新状态
          refreshing.value = false;

          // 关闭加载状态
          loading.value = false;
        }, 500);
      }
    });
  };

  // 获取我的消息

  /** 提示与弹窗：getMyMessageData */
  const getMyMessageData = (type?: boolean): void => {
    getMyMessage(inputParams.value).then((res) => {
      const {
        code,
        data: { list }
      } = res;
      if (Number(code) === 0) {
        if (list.length > 0) {
          const NewList = list.map((item: any) => {
            return {
              ...item,
              isRead: item.status === 0 ? false : true
            };
          });

          // 如果是刷新
          if (!type) {
            NoticeTypeList.value[ActiveNoticeType.value].children = NewList;
          } else {
            // 加载更多
            NoticeTypeList.value[ActiveNoticeType.value].children = [
              ...NoticeTypeList.value[ActiveNoticeType.value].children,
              ...NewList
            ];
          }

          // 更新消息为已读
          updateMessageStatus();
        }

        // 如果返回的数据条数与分页的一致则允许加载更多
        if (list.length < inputParams.value.pageSize) {
          finished.value = true;
        }

        // 延迟关闭
        setTimeout(() => {
          // 关闭刷新状态
          refreshing.value = false;

          // 关闭加载状态
          loading.value = false;
        }, 500);
      }
    });
  };

  // 更新消息状态

  /** 提示与弹窗：updateMessageStatus */
  const updateMessageStatus = (): void => {
    // 获取当前已经显示的页面数据
    const ShowData = NoticeTypeList.value[1].children.map((item: any) => item.id);

    // 如果ShowData为空则不更新
    if (ShowData.length < 1) {
      return;
    }

    updateMessageReadStatus({ ids: ShowData }).then((res) => {
      const { code } = res;
      if (Number(code) === 0) {
        void syncAppIconBadgeWithUnreadCount();
      }
    });
  };

  // 更新公告已读状态

  /** updateNoticeReadStatusData */
  const updateNoticeReadStatusData = (): void => {
    // 获取当前已经显示的页面数据
    const ShowData = NoticeTypeList.value[0].children.map((item: any) => item.id);

    // 如果ShowData为空则不更新
    if (ShowData.length < 1) {
      return;
    }

    updateNoticeReadStatus({ noticeIds: ShowData }).then((res) => {
      const { code } = res;
      if (Number(code) === 0) {
        // void syncAppIconBadgeWithUnreadCount();
      }
    });
  };

  // 获取我的消息未读数量

  /** 提示与弹窗：getMyMessageUnreadCountData */
  const getMyMessageUnreadCountData = (): void => {
    if (!UserStore.getToken) return;
    getMyMessageUnreadCount().then((res) => {
      const { code, data } = res;
      if (Number(code) === 0) {
        NoticeTypeList.value[1].badge = data;
        void applyAppIconBadgeFromMessageUnreadCount(data);
      }
    });
  };

  // 初始化
  onBeforeMount((): void => {
    getNoticeList();
    getMyMessageUnreadCountData();
  });
</script>

<style lang="less" scoped>
  :deep(.van-tabs__nav) {
    .van-tab--active {
      .van-tab__text {
        font-size: 0.3rem !important;
      }
    }

    .van-tab__text {
      font-size: 0.27rem;
    }
  }

  :deep(.van-cell__title) {
    flex: auto;
  }
</style>
