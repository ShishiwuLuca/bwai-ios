<template>
  <PageWrap class="edit-nickname-page">
    <NavBar
      :title="$route.query.type === 'nickname' ? t('edit_nickname_title') : t('edit_sex_title')"
      fixed
      placeholder
      :border="false"
    />
    <div class="edit-nickname-page__body">
      <Field
        v-if="$route.query.type === 'nickname'"
        clickable
        center
        size="large"
        :border="false"
        autocomplete="off"
        v-model="nickname"
        :title="t('nickname_label')"
        :placeholder="t('edit_nickname_placeholder')"
        class="!rounded-sm"
      />
      <div v-else>
        <Popover v-model:show="ShowSexPopover" :offset="[0, 8]" placement="bottom">
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="UserInfo.sex === 1 ? t('sex_male') : t('sex_female')"
              class="!rounded-sm"
            />
          </template>
          <div class="w-29 h-17 overflow-auto p-0.5 bg-[var(--van-background)]">
            <Cell
              v-for="item in SexList"
              :key="item.value"
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="item.label"
              class="!rounded-sm mb-0.5"
              :class="[{ '!bg-[var(--van-primary-color)]': UserInfo.sex === item.value }]"
              @click="onSelectSex(item)"
            />
          </div>
        </Popover>
      </div>
      <div class="mt-1">
        <Button type="primary" block round @click="onSubmit">{{ t('confirm') }}</Button>
      </div>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { ref, computed, watch } from 'vue';
  import { updateUserInfo } from '/@/service/User';
  import { NavBar, PageWrap } from '/@/components';
  import { Field, Button, Popover, Cell } from 'vant';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 昵称（初始可来自用户信息） */
  const nickname = ref<string>('');

  // 是否显示性别选项Popover

  /** 响应式状态：显隐控制 */
  const ShowSexPopover = ref<boolean>(false);

  // 性别选项列表

  /** 响应式状态：列表数据 */
  const SexList = ref<any[]>([
    { label: t('sex_male'), value: 1 },
    { label: t('sex_female'), value: 2 }
  ]);

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  /** 监听用户信息 */
  watch(
    UserInfo,
    (newVal: any) => {
      nickname.value = newVal.nickname;
    },
    { immediate: true, deep: true }
  );

  // 选择性别

  /** 事件或回调处理：onSelectSex */
  const onSelectSex = (item: any) => {
    UserInfo.value.sex = item.value;
    ShowSexPopover.value = false;
  };

  /** 提交修改昵称（待对接接口后返回上一页） */
  const onSubmit = (): void => {
    updateUserInfo({
      nickname: nickname.value,
      sex: UserInfo.value.sex
    }).then((res: any) => {
      const { code } = res;
      if (code === 0) {
        CreateToast(t('update_success'));
        // 重新获取个人信息
        UserStore.fetchUserInfo();
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    });
  };
</script>

<style scoped lang="less">
  .edit-nickname-page {
    color: var(--van-text-color);
  }

  .edit-nickname-page__body {
    padding: 0.32rem;
  }

  .edit-nickname-page__btn {
    margin-top: 0.4rem;
    height: 0.88rem;
  }

  :deep(.van-popover__wrapper) {
    width: 100%;
  }
</style>
