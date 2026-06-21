<template>
  <div class="user-benefits-page">
  <NavBar :title="t('user_benefits_title')" />
  <PageWrap>
    <div class="p-[0.32rem]">
      <div class="flex items-center justify-start gap-1.5">
        <div class="avatar">
          <Uploader
            v-model="UserUploadAvatar"
            :deletable="false"
            class="user-benefits__uploader !w-full"
            :after-read="ImageCompressionFn"
            accept="image/jpeg,image/png,image/jpg,image/heic,image/webp"
            :max-count="1"
          >
            <VanImage :src="UserInfo.avatar || Avatar" fit="cover" round class="avatar__img" />
          </Uploader>
        </div>
        <div>
          <div class="text-[0.4rem] text-[#222534] font-bold">{{ UserInfo.nickname }}</div>
          <div class="text-[0.32rem] font-bold flex items-center justify-start gap-0.5 text-[#767B98]">
            <div>ID: {{ UserInfo.id }}</div>
            <div @click="CopyText(UserInfo.id)">
              <VanImage :src="CopyIcon" width="22px" height="22px" />
            </div>
          </div>
        </div>
      </div>
      <div class="p-1 rounded relative mt-2 user-benefits-vip-card">
        <div class="flex items-center justify-between">
          <div class="text-[0.24rem] text-black">{{ t('current_level_title') }}</div>
          <VanImage class="!absolute top-[-450%] right-[-2%]" :src="Level" width="2.5rem" />
        </div>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          class="!bg-transparent !pl-0 !pr-0 !pb-0 !pt-0.5"
          :title="UserInfo.level.name || 'VIP1'"
          title-class="!text-[#E87512] !font-bold !text-[0.36rem]"
          is-link
          to="/TeamBenefits"
        />
        <Progress
          :percentage="vipProgressPercent"
          :show-pivot="false"
          stroke-width="4"
          color="linear-gradient(90deg, #f5a623 0%, #e87512 100%)"
          track-color="rgba(255,255,255,0.45)"
          class="mt-[0.16rem]"
        />
      </div>

      <!-- 账户设置 -->
      <div class="mt-[0.32rem]">
        <div class="section-title mb-[0.16rem]">{{ t('account_settings_title') }}</div>
        <div class="user-benefits-page__card rounded-sm p-[0.24rem] text-[0.26rem]">
          <div class="flex items-start gap-[0.24rem] py-[0.18rem]">
            <span class="shrink-0 text-[#2071f8] font-medium">{{ t('team_condition_label_1') }}</span>
            <span class="text-[#333] text-right flex-1">{{ t('team_condition_value_1', [formatInt(currentTeamLevelRow?.fundAmount ?? 0)]) }}</span>
          </div>
          <div class="flex items-start gap-[0.24rem] py-[0.18rem]">
            <span class="shrink-0 text-[#2071f8] font-medium">{{ t('team_condition_label_2') }}</span>
            <span class="text-[#333] text-right flex-1">{{ t('team_condition_value_2', [formatNum(currentTeamLevelRow?.pointSum ?? 0)]) }}</span>
          </div>
          <div class="flex items-start gap-[0.24rem] py-[0.18rem]">
            <span class="shrink-0 text-[#2071f8] font-medium">{{ t('team_benefit_label') }}</span>
            <span class="text-[#333] text-right flex-1">{{ t('team_benefit_value_1', [formatNum(currentTeamLevelRow?.jrate ?? 0), formatNum(currentTeamLevelRow?.erate ?? 0), formatNum(currentTeamLevelRow?.brate ?? 0)]) }}</span>
          </div>
        </div>
      </div>
      <!-- 个人信息：Cell 列表 -->
      <div class="mt-[0.32rem]">
        <div class="section-title mb-[0.16rem]">{{ t('personal_info_title') }}</div>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('uid_label')"
          title-class="!text-[#000] !font-medium"
          value-class="!text-[#727794]"
          :value="UserInfo.id"
          class="user-benefits-page__cell !rounded-sm mb-1"
        >
          <template #right-icon>
            <span class="cursor-pointer" @click="CopyText(UserInfo.id)">
              <VanImage :src="CopyIcon" width="18px" height="18px" class="ml-0.5" />
            </span>
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('nickname_label')"
          title-class="!text-[#000] !font-medium"
          value-class="!text-[#727794]"
          :value="UserInfo.nickname"
          class="user-benefits-page__cell !rounded-sm mb-1"
          is-link
          to="/UpgradeUserInfo?type=nickname"
        >
          <template #right-icon>
            <Icon class="ml-0.5" name="edit" :size="18" color="#2071f8" />
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('sex_label')"
          title-class="!text-[#000] !font-medium"
          value-class="!text-[#727794]"
          :value="UserInfo.sex === 1 ? t('sex_male') : t('sex_female')"
          class="user-benefits-page__cell !rounded-sm mb-1"
          is-link
          to="/UpgradeUserInfo?type=sex"
        >
          <template #right-icon>
            <Icon class="ml-0.5" name="edit" :size="18" color="#2071f8" />
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('vip_level_label')"
          title-class="!text-[#000] !font-medium"
          value-class="!text-[#2071F8] !font-semibold"
          :value="UserInfo.level.name || 'VIP 1'"
          class="user-benefits-page__cell !rounded-sm mb-1"
        />
      </div>
    </div>
  </PageWrap>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { computed, onBeforeMount, ref } from 'vue';
  import { getTeamRewardConfig } from '/@/service/Team';
  import {
    buildTeamRewardCardsFromPayload,
    getTeamRewardCardForUserVip,
    getUserVipLevel,

    /** TeamRewardCard：类型别名 */
    type TeamRewardCard
  } from '/@/utils/teamRewardLevelConfig';
  import Level from '/@/assets/images/vip.png';
  import { useCopyToClipboard } from '/@/utils';
  import { uploadFile } from '/@/service/System';
  import Avatar from '/@/assets/images/avatar_default.png';
  import CopyIcon from '/@/assets/images/copy_icon.png';
  import { NavBar, PageWrap } from '/@/components';
  import { updateUserInfo } from '/@/service/User';
  import { useMessage } from '/@/hooks/web/useMessage';
  import imageCompression from 'browser-image-compression';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { Cell, Icon, Image as VanImage, Uploader, Progress } from 'vant';

  /** 从 useI18n 解构的文案与能力 */
  const { t } = useI18n();

  /** 用户：UserStore */
  const UserStore = useUserStoreWithOut();

  /** 从 useMessage 解构的 Toast / Dialog 能力 */
  const { CreateToast, CreateLoadingToast, CreateCloseToast } = useMessage();

  // 上传状态

  /** 响应式状态：拉取接口数据 */
  const UploadStatus = ref<boolean>(false);

  // 用户头像上传

  /** 响应式状态：拉取接口数据 */
  const UserUploadAvatar = ref<any[]>([]);

  // 用户信息

  /** 计算属性：用户 */
  const UserInfo: any = computed(() => {
    return UserStore.getUserInfo;
  });

  // 与团队权益页同一接口，按当前 VIP 匹配一条等级配置

  /** 响应式状态：团队 */
  const teamRewardCards = ref<TeamRewardCard[]>([]);

  /** 计算属性：团队 */
  const currentTeamLevelRow = computed(() =>
    getTeamRewardCardForUserVip(
      teamRewardCards.value,
      getUserVipLevel(UserInfo.value as Record<string, unknown>)
    )
  );

  /** 计算属性：VIP 进度百分比 */
  const vipProgressPercent = computed(() => {
    const userLevel = getUserVipLevel(UserInfo.value as Record<string, unknown>);
    const maxLevel =
      teamRewardCards.value.length > 0
        ? Math.max(...teamRewardCards.value.map((c) => c.level))
        : 1;
    return Math.min(100, Math.max(5, Math.round((userLevel / maxLevel) * 100)));
  });

  /** 格式化展示：formatInt */
  const formatInt = (v: number): string => {
    if (!Number.isFinite(v)) return '0';
    return Math.round(v).toLocaleString();
  };

  /** 格式化展示：formatNum */
  const formatNum = (v: number): string => {
    if (!Number.isFinite(v)) return '0';
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(4).replace(/\.?0+$/, '');
  };

  /** 拉取接口数据：fetchTeamRewardConfig */
  const fetchTeamRewardConfig = (): void => {
    getTeamRewardConfig()
      .then((res) => {
        if (Number(res.code) === 0) {
          teamRewardCards.value = buildTeamRewardCardsFromPayload(res.data);
        } else {
          teamRewardCards.value = [];
        }
      })
      .catch(() => {
        teamRewardCards.value = [];
      });
  };

  onBeforeMount(() => {
    fetchTeamRewardConfig();
  });

  // 参数

  /** 响应式状态：inputParams 相关 UI 或数据 */
  const inputParams = ref<any>(UserInfo.value);

  // 图片压缩

  /** 事件或回调处理：ImageCompressionFn */
  const ImageCompressionFn = (file: any) => {
    // 计算图片大小

    /** FileSize */
    const FileSize = file.size / 1024 / 1024;

    // 如果大小小于5MB则不进行压缩处理
    if (FileSize < 5) {
      // 直接上传不进行压缩
      UploadReady(file);
      return false;
    }

    // 压缩选项 - 优化配置以减少失真（证件照需要更清晰）

    /** 常量或静态配置：options */
    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920, // 提高最大尺寸，保持更好的清晰度（证件照需要清晰）
      useWebWorker: true,
      initialQuality: 0.97, // 提高初始质量，减少失真
      fileType: file.type, // 保持原始文件类型
      preserveExif: false // 不保留EXIF数据以减小文件大小
    };

    imageCompression(file.file, options)
      .then((compressedFile) => {
        console.log('压缩后大小:', (compressedFile.size / 1024).toFixed(2), 'KB');
        const newFile = new File([compressedFile], compressedFile.name, { type: file.type });
        UploadReady(newFile);
      })
      .catch((error) => {
        console.error('压缩失败:', error);
        UploadReady(file);
      });
  };

  // 将图片转为base64
  // const FileImageToBase64 = (file: File): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader()
  //     reader.readAsDataURL(file)
  //     reader.onload = () => {
  //       const base64 = reader.result as string
  //       // 去除 data:image/...;base64, 前缀
  //       const pureBase64 = base64.replace(/^data:.+;base64,/, '')
  //       resolve(pureBase64)
  //     }
  //     reader.onerror = error => reject(error)
  //   });
  // }

  // 上传图片

  /** 拉取接口数据：UploadReady */
  const UploadReady = (file: any) => {
    file.status = 'uploading';
    file.message = 'loading';
    try {
      CreateLoadingToast({ message: 'loading', forbidClick: true, duration: 0 });

      uploadFile({ file: file, time: new Date().getTime() })
        .then((res: any) => {
          const { code, msg } = res;
          if (Number(code) === 0 && res.data) {
            const {
              data: { url }
            } = res;
            file.status = 'success';
            file.message = msg;
            // 正面
            UserUploadAvatar.value = [{ url }];
            inputParams.value.avatar = url;
            UploadStatus.value = false;

            CreateCloseToast();

            // 提交修改头像
            onSubmit();
          } else {
            file.status = 'failed';
            file.message = msg;
            CreateCloseToast();
          }
        })
        .catch(() => {
          file.status = 'failed';
          file.message = 'Error';
          CreateCloseToast();
        });
    } catch {
      file.status = 'failed';
      file.message = 'Error';
      CreateCloseToast();
    }
  };

  /** 提交修改头绪 */
  const onSubmit = (): void => {
    updateUserInfo({
      avatar: inputParams.value.avatar,
      nickname: UserInfo.value.nickname,
      sex: UserInfo.value.sex
    }).then((res: any) => {
      const { code } = res;
      if (code === 0) {
        CreateToast(t('update_success'));
        // 重新获取个人信息
        UserStore.fetchUserInfo();
      }
    });
  };

  // 复制文字

  /** CopyText */
  const CopyText = (text: string) => {
    useCopyToClipboard(text);
    CreateToast(t('copy_success'));
  };
</script>

<style lang="less" scoped>
  .user-benefits-page {
    background: #f2f5fe;
    min-height: 100vh;

    :deep(.van-nav-bar) {
      background: transparent !important;
    }

    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000000 !important;
    }

    :deep(.page-wrap) {
      background: transparent;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.12rem;
    font-size: 0.28rem;
    font-weight: 600;
    color: #000;

    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 0.28rem;
      background: #2071f8;
      border-radius: 2px;
      flex-shrink: 0;
    }
  }

  .user-benefits-vip-card {
    background-image: url('/@/assets/images/vip_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    box-shadow: inset 0 0 27px 8px rgba(255, 255, 255, 1);
  }

  .user-benefits-page__card {
    background: #f9faff;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  }

  .user-benefits-page__cell {
    background: #f9faff !important;
    box-shadow: 0 0 2px rgba(87, 119, 251, 0.25);
  }

  .user-benefits__uploader {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }

  .avatar {
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    box-sizing: border-box;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #e0e1fd;
    background: #f9faff;
  }

  .avatar__img {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  .avatar__img :deep(.van-image__img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
