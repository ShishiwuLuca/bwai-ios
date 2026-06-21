<template>
  <NavBar :title="t('edit_address_title')" fixed placeholder :border="false">
    <template #right>
      <Icon @click="onDelete" name="delete-o" :size="22" color="var(--van-text-color)" />
    </template>
  </NavBar>
  <PageWrap class="min-h-screen">
    <div class="flex flex-col gap-[0.32rem] p-[0.32rem]">
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('add_address_network') }}</label>
        <Popover
          v-model:show="showNetworkPopover"
          :offset="[0, 8]"
          placement="bottom"
          @select="onSelectNetwork"
        >
          <template #reference>
            <Cell
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="form.type || networkActions[0]?.text"
              class="!rounded-sm"
            />
          </template>
          <div class="w-29 h-17 overflow-auto p-0.5 bg-[var(--van-background)]">
            <Cell
              v-for="item in networkActions"
              :key="item.text"
              clickable
              center
              size="large"
              :border="false"
              is-link
              :title="item.text"
              class="!rounded-sm mb-0.5"
              @click="onSelectNetwork(item)"
            />
          </div>
        </Popover>
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('add_address_wallet_address') }}</label>
        <Field
          clickable
          center
          size="large"
          v-model="form.address"
          :placeholder="t('add_address_placeholder_address')"
          :border="false"
          autocomplete="off"
          class="add-address-field !rounded-sm"
          right-icon="scan"
          @click-right-icon="onScanOrPaste"
        />
      </div>
      <div class="flex flex-col gap-[0.16rem]">
        <label class="text-[0.28rem] text-white">{{ t('add_address_wallet_name') }}</label>
        <Field
          clickable
          center
          size="large"
          v-model="form.remark"
          :placeholder="t('add_address_placeholder_name')"
          :border="false"
          autocomplete="off"
          class="add-address-field !rounded-sm"
        />
      </div>
      <Button type="primary" block round @click="onSubmit">
        {{ t('add_address_save') }}
      </Button>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import type { PopoverAction } from 'vant';
  import { computed, ref, watch } from 'vue';
  import type { AddressForm } from '/#/views';
  import { NavBar, PageWrap } from '/@/components';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Cell, Field, Button, Popover, Icon } from 'vant';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 路由实例：编程式导航 */
  const router = useRouter();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateConfirmDialog } = useMessage();

  // 是否显示网络选择弹窗

  /** 响应式状态：显隐控制 */
  const showNetworkPopover = ref(false);

  // 网络选择列表

  /** 常量或静态配置：networkActions */
  const networkActions: PopoverAction[] = [
    { text: 'ETH' },
    { text: 'TRC20' },
    { text: 'BSC' },
    { text: 'Polygon' }
  ];

  // 表单数据

  /** 响应式状态：form 相关 UI 或数据 */
  const form = ref<AddressForm>({
    type: 'ETH',
    remark: '',
    address: ''
  });

  // 需要修改的地址数据

  /** 计算属性：由其它状态派生的展示或判断 */
  const editAddress = computed(() => {
    return UserStore.getEditAddress;
  });

  // 监听需要修改的地址数据

  /** 侦听依赖变化并触发副作用 */
  watch(
    editAddress,
    (newVal: any) => {
      form.value.address = newVal.address;
      form.value.remark = newVal.label;
    },
    { immediate: true, deep: true }
  );

  /** 事件或回调处理：onSelectNetwork */
  const onSelectNetwork = (action: PopoverAction) => {
    form.value.type = action.text;
    showNetworkPopover.value = false;
  };

  /** 是否允许某操作：onScanOrPaste */
  const onScanOrPaste = () => {
    // 调用手机扫码
  };

  /** 提交中：onSubmit */
  const onSubmit = () => {
    console.log('add address', form);
    router.back();
  };

  // 删除地址

  /** 事件或回调处理：onDelete */
  const onDelete = () => {
    CreateConfirmDialog({
      title: t('edit_address_delete_title'),
      message: t('edit_address_delete_message'),
      confirmButtonText: t('edit_address_delete_confirm'),
      cancelButtonText: t('edit_address_delete_cancel')
    }).then(() => {
      //
    });
  };
</script>

<style lang="less" scoped>
  .add-address-field :deep(.van-cell) {
    background: #1e2540;
    color: #fff;
  }

  .add-address-field :deep(.van-field__control) {
    color: #fff;
  }

  .add-address-field :deep(.van-field__control::placeholder) {
    color: rgba(255, 255, 255, 0.5);
  }

  .add-address-field :deep(.van-icon) {
    color: #fff;
  }

  :deep(.van-popover__wrapper) {
    width: 100%;
  }
</style>
