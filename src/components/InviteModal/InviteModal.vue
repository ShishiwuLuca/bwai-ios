<template>
  <template v-if="!$slots.default">
    <Cell
      @click="ShowModal = true"
      clickable
      center
      size="large"
      :border="false"
      class="border border-solid border-[#EDD59C] rounded mt-1"
      :title="t('invite_friends_title')"
      :value="t('invite_friends_value')"
      value-class="!text-[var(--van-text-color)]"
      is-link
      :style="{ background: 'linear-gradient(180deg, #020237 0%, #111A45 100%)' }"
    >
      <template #icon>
        <Icon :name="InviteIcon" class="mr-0.7" :size="30" color="var(--van-primary-color)" />
      </template>
    </Cell>
  </template>
  <template v-else>
    <div @click="ShowModal = true">
      <slot name="default"></slot>
    </div>
  </template>
  <Popup
    v-model:show="ShowModal"
    :safe-area-inset-top="true"
    :safe-area-inset-bottom="true"
    class="p-1 !pr-0 !pl-1.6 !bg-transparent invite-modal-popup !w-full"
    position="center"
  >
    <div class="p-1 flex items-center justify-end 2">
      <Icon name="cross" :size="28" color="var(--van-text-color)" @click="ShowModal = false" />
    </div>
    <div ref="shareImgRef" class="w-full h-full relative share_img">
      <VanImage :src="Logo" height="0.6rem" class="!absolute top-1 md:top-1.5 left-1 z-1000" />
      <VanImage :src="InviteBg" width="100%" height="100%" />
      <div
        class="absolute w-full top-6 md:top-8 left-0 p-1 !pr-2.5 z-2 text-[var(--van-text-color)] text-[0.4rem] font-bold"
        >{{ t('share_title') }}</div
      >
      <div
        class="absolute w-full bottom-0 md:bottom-1.5 left-0 text-[var(--van-text-color)] z-2 h-11 pl-1 pt-0.8 pr-2.5 pb-1"
      >
        <div class="flex items-center justify-between">
          <div :style="{ 'line-height': 'normal' }" class="w-[5rem]">
            <div class="text-[0.35rem] font-bold">{{ t('share_invite_title') }}</div>
            <div class="text-[0.3rem] text-[var(--van-tabbar-border-color)]">{{
              t('tp_invite_code')
            }}</div>
            <div class="text-[0.3rem] flex items-center gap-0.5">
              <div>{{ UserInfo.inviteCode }}</div>
              <Icon
                @click="CopyText(UserInfo.inviteCode)"
                class-prefix="exchange-icon"
                name="copy"
                :size="22"
                color="var(--van-primary-color)"
              />
            </div>
            <div class="text-[0.3rem] text-[var(--van-tabbar-border-color)]">{{
              t('tp_invite_link')
            }}</div>
            <div class="text-[0.3rem] flex items-center gap-0.5">
              <div class="max-w-[82%] w-[82%] overflow-hidden">{{ inviteLink }}</div>
              <Icon
                @click="CopyInviteLink"
                class-prefix="exchange-icon"
                name="copy"
                :size="22"
                color="var(--van-primary-color)"
              />
            </div>
          </div>
          <div class="p-0.5 bg-white rounded-sm md:mr-1">
            <QrcodeVue :value="inviteLink" :size="100" level="M" />
          </div>
        </div>
      </div>
    </div>
    <div class="p-2 !pt-1 !pl-0 flex items-center justify-center gap-1">
      <Button type="primary" block round @click="onSave">{{ t('add_address_save') }}</Button>
    </div>
  </Popup>
</template>

<script setup lang="ts">
  import QrcodeVue from 'qrcode.vue';
  import html2canvas from 'html2canvas';
  import { computed, ref } from 'vue';
  import { useCopyToClipboard } from '/@/utils';
  import { useI18n } from '/@/hooks/web/useI18n';
  import InviteIcon from '/@/assets/images/invite.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import InviteBg from '/@/assets/images/invite_bg.png';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import {
    downloadCanvasPngWeb,
    isCapacitorNative,
    shareCanvasPngNative
  } from '/@/utils/shareInviteImage';
  import { Popup, Cell, Icon, Image as VanImage, Button } from 'vant';
  import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** SystemStore */
  const SystemStore = useSystemStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast } = useMessage();

  // 是否显示弹窗

  /** 响应式状态：显隐控制 */
  const ShowModal = ref<boolean>(false);

  /** 整张分享卡 DOM（用于 html2canvas 导出） */
  const shareImgRef = ref<HTMLElement | null>(null);

  // 邀请链接

  /** 计算属性：由其它状态派生的展示或判断 */
  const inviteLink = computed(() => {
    // 如果是App
    if (isCapacitorNative()) {
      return SystemStore.getWebPath;
    }
    return location.origin;
  });

  // 会员信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  // logo

  /** 计算属性：由其它状态派生的展示或判断 */
  const Logo = computed(() => {
    return SystemStore.getSiteLogo;
  });

  // 复制文字

  /** CopyText */
  const CopyText = (text: string) => {
    useCopyToClipboard(text);
    CreateToast(t('copy_success'));
  };

  // 复制邀请链接

  /** CopyInviteLink */
  const CopyInviteLink = () => {
    const InviteLinkPath = inviteLink.value + '/Register?InviteCode=' + UserInfo.value.inviteCode;
    useCopyToClipboard(InviteLinkPath);
    CreateToast(t('copy_success'));
  };

  // 将整张分享卡（背景 + 文案 + 二维码）保存为 PNG
  // - H5：触发浏览器下载
  // - APP（Capacitor）：写入缓存后调系统分享，用户可保存到相册等；失败则尝试用系统打开图片

  /** 事件或回调处理（onSave） */
  const onSave = async () => {
    const el = shareImgRef.value;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: Math.min(2, window.devicePixelRatio || 2),
        logging: false
      });
      const fileName = `invite_${Date.now()}.png`;
      if (isCapacitorNative()) {
        await shareCanvasPngNative(canvas, {
          fileName,
          title: t('share_invite_title'),
          dialogTitle: t('add_address_save')
        });
      } else {
        await downloadCanvasPngWeb(canvas, 'invite.png');
      }
    } catch {
      CreateToast(t('errorMessage'));
    }
  };
</script>

<style lang="less" scoped></style>
