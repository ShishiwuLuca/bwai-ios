<template>
  <template v-if="!$slots.default">
    <Cell
      @click="ShowModal = true"
      clickable
      center
      size="large"
      :border="false"
      class="rounded mt-1"
      :title="t('invite_friends_title')"
      title-class="!text-[#000] !font-medium"
      :value="t('invite_friends_value')"
      value-class="!text-[#727794]"
      is-link
      :style="{ background: '#F9FAFF', boxShadow: '0 0 2px rgba(87,119,251,0.25)' }"
    >
      <template #icon>
        <VanImage :src="InviteIconImg" width="30px" height="30px" class="mr-0.7" />
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
    :safe-area-inset-bottom="true"
    class="invite-modal-popup !bg-transparent"
    position="center"
  >
    <div class="invite-modal-shell">
      <div class="invite-modal__card" ref="shareImgRef">
      <!-- 背景图 -->
      <VanImage :src="InviteBg" width="100%" class="invite-modal__bg" />
      <!-- 内容层 -->
      <div class="invite-modal__content">
        <div class="invite-modal__inner">
          <!-- Logo + 标题行 -->
          <div class="invite-modal__logo-row">
            <VanImage :src="Logo" height="0.52rem" fit="contain" />
          </div>
          <!-- 分享标题 -->
          <div class="invite-modal__title">{{ t('share_title') }}</div>
          <!-- 邀请区域 -->
          <div class="invite-modal__invite-section">
            <div class="invite-modal__invite-info">
              <div class="invite-modal__invite-label">{{ t('share_invite_title') }}</div>
              <div class="invite-modal__row">
                <span class="invite-modal__sub-label">{{ t('tp_invite_code') }}</span>
              </div>
              <div class="invite-modal__row invite-modal__row--value">
                <span class="invite-modal__value font-semibold tracking-wider">{{ UserInfo.inviteCode }}</span>
                <VanImage :src="CopyIconImg" width="16px" height="16px" @click="CopyText(UserInfo.inviteCode)" />
              </div>
              <div class="invite-modal__row mt-[0.2rem]">
                <span class="invite-modal__sub-label">{{ t('tp_invite_link') }}</span>
              </div>
              <div class="invite-modal__row invite-modal__row--value">
                <span class="invite-modal__link">{{ inviteLink }}</span>
                <VanImage :src="CopyIconImg" width="16px" height="16px" @click="CopyInviteLink" />
              </div>
            </div>
            <div class="invite-modal__qrcode">
              <QrcodeVue :value="inviteLink" :size="88" level="M" />
            </div>
          </div>
          <!-- 邀请按钮 -->
          <div class="invite-modal__footer">
            <Button block round class="invite-modal__save-btn" @click="ShowShareSheet = true">{{ t('invite_modal_btn') }}</Button>
          </div>
        </div>
      </div>
      </div>
      <button
        type="button"
        class="invite-modal__close"
        :aria-label="t('cancel')"
        @click="ShowModal = false"
      >
        <Icon name="cross" />
      </button>
    </div>
  </Popup>

  <!-- 分享底部弹窗 -->
  <Popup v-model:show="ShowShareSheet" position="bottom" round :safe-area-inset-bottom="true">
    <div class="share-sheet">
      <div class="share-sheet__title">Share with friends</div>
      <div class="share-sheet__options">
        <div class="share-sheet__item" @click="onSave">
          <div class="share-sheet__icon-wrap">
            <img class="share-sheet__icon" :src="SaveImageIcon" alt="Save Image" />
          </div>
          <span class="share-sheet__label">{{ t('share_save_image') }}</span>
        </div>
        <div class="share-sheet__item" @click="onShareTiktok">
          <div class="share-sheet__icon-wrap">
            <img class="share-sheet__icon" :src="TiktokIcon" alt="Tik Tok" />
          </div>
          <span class="share-sheet__label">Tik Tok</span>
        </div>
        <div class="share-sheet__item" @click="onShareYoutube">
          <div class="share-sheet__icon-wrap">
            <img class="share-sheet__icon" :src="YoutubeIcon" alt="YouTube" />
          </div>
          <span class="share-sheet__label">YouTube</span>
        </div>
        <div class="share-sheet__item" @click="onShareTelegram">
          <div class="share-sheet__icon-wrap">
            <img class="share-sheet__icon" :src="TelegramIcon" alt="Telegram" />
          </div>
          <span class="share-sheet__label">Telegram</span>
        </div>
      </div>
      <div class="share-sheet__cancel" @click="ShowShareSheet = false">{{ t('cancel') }}</div>
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
  import InviteIconImg from '/@/assets/images/invite_icon.png';
  import CopyIconImg from '/@/assets/images/copy_icon.png';
  import SaveImageIcon from '/@/assets/images/save_image.png';
  import TiktokIcon from '/@/assets/images/tiktok.png';
  import YoutubeIcon from '/@/assets/images/youtube.png';
  import TelegramIcon from '/@/assets/images/telegram.png';
  import { useMessage } from '/@/hooks/web/useMessage';
  import InviteBg from '/@/assets/images/invite_bg_popup.png';
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

  /** 分享底部弹窗显隐 */
  const ShowShareSheet = ref<boolean>(false);

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
    ShowShareSheet.value = false;
  };

  const onShareTiktok = (): void => {
    ShowShareSheet.value = false;
  };

  const onShareYoutube = (): void => {
    ShowShareSheet.value = false;
  };

  const onShareTelegram = (): void => {
    ShowShareSheet.value = false;
  };
</script>

<style lang="less" scoped>
  .invite-modal-popup {
    width: 86vw !important;
    border-radius: 0.24rem;
    overflow: visible !important;
  }

  .invite-modal-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .invite-modal__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.72rem;
    height: 0.72rem;
    margin-top: 0.36rem;
    padding: 0;
    border: 2px solid rgba(255, 255, 255, 0.85);
    border-radius: 50%;
    background: #92B6FF;
    backdrop-filter: blur(4px);
    box-shadow: 0 0.04rem 0.16rem rgba(0, 0, 0, 0.12);
    color: #fff;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;

    :deep(.van-icon) {
      font-size: 0.32rem;
      font-weight: 700;
    }

    &:active {
      opacity: 0.88;
      transform: scale(0.94);
      background: rgba(255, 255, 255, 0.28);
    }
  }

  .invite-modal__card {
    position: relative;
    width: 100%;
    border-radius: 0.24rem;
    overflow: hidden;
  }

  .invite-modal__bg {
    display: block;
    width: 100%;
    :deep(img) { display: block; width: 100%; }
  }

  .invite-modal__content {
    position: absolute;
    inset: 0;
    padding: 0.4rem 18px 0.32rem;
    display: flex;
    flex-direction: column;
  }

  .invite-modal__inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 18px 15px;
  }

  .invite-modal__logo-row {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    border-radius: 100px;
    background: #fff;
    padding: 6px 10px;
    margin-bottom: 0.24rem;
  }

  .invite-modal__title {
    font-size: 0.34rem;
    font-weight: 700;
    color: #000;
    line-height: 1.4;
    margin-bottom: 0.32rem;
    max-width: 70%;
  }

  .invite-modal__invite-section {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.24rem;
    margin-top: 35px;
  }

  .invite-modal__invite-info {
    flex: 1;
    min-width: 0;
  }

  .invite-modal__invite-label {
    font-size: 0.28rem;
    font-weight: 700;
    color: #000;
    margin-bottom: 0.12rem;
  }

  .invite-modal__row {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    line-height: 1.4;
  }

  .invite-modal__sub-label {
    font-size: 0.22rem;
    color: #9b9b9b;
  }

  .invite-modal__value {
    font-size: 0.26rem;
    color: #333;
  }

  .invite-modal__link {
    font-size: 0.22rem;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 80%;
  }

  .invite-modal__qrcode {
    flex-shrink: 0;
    padding: 0.1rem;
    background: #fff;
    border-radius: 0.08rem;
    box-shadow: 0 -2px 4px 0 rgba(26, 55, 253, 0.25);
  }

  .invite-modal__footer {
    padding: 0.24rem 0 0;
    margin-top: auto;
  }

  .share-sheet {
    padding: 0.4rem 0.32rem;

    &__title {
      font-size: 0.3rem;
      font-weight: 600;
      color: #000;
      margin-bottom: 0.48rem;
    }

    &__options {
      display: flex;
      align-items: flex-start;
      justify-content: space-around;
      margin-bottom: 0.48rem;
    }

    &__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.16rem;
      cursor: pointer;
    }

    &__icon-wrap {
      width: 1rem;
      height: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    &__icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__label {
      font-size: 0.24rem;
      color: #333;
    }

    &__cancel {
      text-align: center;
      font-size: 0.3rem;
      color: #333;
      padding: 0.24rem 0;
      border-radius: 0.48rem;
      background: #f2f5fe;
      cursor: pointer;
    }
  }

  .invite-modal__save-btn {
    background: linear-gradient(180deg, #92b6ff 0%, #2a61f9 100%) !important;
    border: none !important;
    color: #fff !important;
    font-size: 0.32rem !important;
    font-weight: 600 !important;
  }
</style>
