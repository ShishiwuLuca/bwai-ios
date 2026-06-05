<template>
  <PageWrap class="min-h-screen">
    <NavBar :title="t('address_book_title')" fixed placeholder :border="false">
      <template #right>
        <div @click="goAdd">{{ t('address_book_add_btn') }}</div>
      </template>
    </NavBar>
    <PullRefresh
      v-model="refreshing"
      @refresh="onRefresh"
      class="!overflow-auto p-1"
      :style="{ height: 'calc(100vh - var(--van-nav-bar-height) - 50px)' }"
    >
      <List v-model:loading="loading" :finished="finished" @load="onLoad">
        <template #finished>
          <Empty v-if="AddressBookList.length < 1" :image="EmptyImg" image-size="4rem">
            <template #description>
              <span class="text-[0.32rem] text-white">{{ t('address_book_empty_text') }}</span>
            </template>
          </Empty>
          <Button
            v-if="AddressBookList.length < 1"
            type="primary"
            block
            round
            class="!mx-auto !w-[4rem]"
            @click="goAdd"
          >
            {{ t('address_book_add_btn') }}
          </Button>
        </template>
        <SwipeCell v-for="(item, index) in AddressBookList" :key="index">
          <Cell
            clickable
            center
            size="large"
            :border="false"
            class="rounded !pt-1 !pb-1 mb-1"
            :title="item.label"
            :label="item.address"
            is-link
            @click="select(item)"
          />
          <template #right>
            <div class="flex items-center !h-full p-1 w-3" @click="onDelete(item)">
              <div>
                <Icon name="delete-o" :size="22" color="var(--van-danger-color)" />
              </div>
            </div>
          </template>
        </SwipeCell>
      </List>
      <BackTop :offset="20" :right="10" :bottom="70" />
    </PullRefresh>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { NavBar, PageWrap } from '/@/components';
  import { useMessage } from '/@/hooks/web/useMessage';
  import EmptyImg from '/@/assets/images/empty_address.png';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { getAddressBookList, deleteAddress } from '/@/service/Wallet';
  import { Cell, Button, PullRefresh, List, Empty, BackTop, SwipeCell, Icon } from 'vant';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateConfirmDialog, CreateToast } = useMessage();

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
    pageNo: 0,
    pageSize: 10
  });

  /** 地址簿列表：标识、备注、地址、是否当前选中（待接接口） */
  const AddressBookList = ref<any[]>([]);

  // 下拉刷新事件

  /** 下拉刷新：onRefresh */
  const onRefresh = (): void => {
    inputParams.value.pageNo = 1;
    // 清空列表数据
    finished.value = false;
    getAddressBookListData();
  };

  // 上啦加载更多事件

  /** 拉取接口数据：onLoad */
  const onLoad = () => {
    loading.value = true;

    inputParams.value.pageNo++;

    getAddressBookListData(true);
  };

  // 获取地址簿列表

  /** getAddressBookListData */
  const getAddressBookListData = (type: boolean = false) => {
    getAddressBookList(inputParams.value).then((res) => {
      const { code, data } = res;
      if (Number(code) === 0 && data) {
        const {
          data: { list }
        } = res;
        if (list.length > 0) {
          // 如果是刷新
          if (!type) {
            AddressBookList.value = list;
          } else {
            // 加载更多
            AddressBookList.value = [...AddressBookList.value, ...list];
          }
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

  /** 页面跳转：goAdd */
  const goAdd = () => {
    router.push('/AddAddress?type=add');
  };

  /** 选中某条地址 */
  const select = (item: any) => {
    // 保存需要修改的地址信息
    UserStore.setEditAddress(item);
    router.push('/AddAddress?type=edit');
  };

  // 删除地址

  /** 事件或回调处理：onDelete */
  const onDelete = (item: any) => {
    CreateConfirmDialog({
      title: t('common_title_text'),
      message: t('address_book_delete_message'),
      confirmButtonText: t('address_book_delete_confirm'),
      cancelButtonText: t('address_book_delete_cancel')
    }).then(() => {
      // 删除地址
      deleteAddress({ id: item.id }).then((res) => {
        const { code, msg } = res;
        if (code === 0) {
          CreateToast(t('address_book_delete_success'));
          onRefresh();
        } else {
          CreateToast(msg);
        }
      });
    });
  };
</script>

<style lang="less" scoped>
  :deep(.van-cell) {
    background: var(--van-card-linear-background) !important;
    border: 1px solid var(--van-border-color) !important;
  }
</style>
