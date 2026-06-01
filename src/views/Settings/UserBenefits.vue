<template>
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
          <div class="text-[0.4rem] text-[#EDD59C] font-bold">{{ UserInfo.nickname }}</div>
          <div class="text-[0.32rem] font-bold flex items-center justify-start gap-0.5">
            <div>ID: {{ UserInfo.id }}</div>
            <div @click="CopyText(UserInfo.id)">
              <Icon
                class-prefix="exchange-icon"
                name="copy"
                :size="22"
                color="var(--van-primary-color)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="p-1 border border-solid border-[#EDD59C] rounded relative mt-2 bg_linear">
        <div class="flex items-center justify-between">
          <div class="text-[0.26rem]">{{ t('current_level_title') }}</div>
          <VanImage class="!absolute top-[-450%] right-[-2%]" :src="Level" width="2.5rem" />
        </div>
        <Cell
          clickable
          center
          size="large"
          class="!bg-transparent !pl-0 !pr-0 !pb-0 !pt-0.5"
          :title="UserInfo.level.name || 'VIP1'"
          title-class="!text-[#EDD59C] !font-bold !text-[0.4rem]"
          is-link
          to="/TeamBenefits"
        />
      </div>

      <!-- 团队权益 -->
      <div class="mt-[0.32rem]" v-if="UserInfo.level?.level && UserInfo.level?.level > 0">
        <div class="mb-[0.16rem] text-[0.28rem] font-bold text-white">{{
          t('team_rights_title')
        }}</div>
        <div class="rounded-sm bg-[var(--van-card-background)] p-[0.28rem] text-[0.26rem]">
          <div>{{ t('team_condition_1', [formatInt(currentTeamLevelRow?.fundAmount ?? 0)]) }}</div>
          <div class="mt-[0.12rem]">{{
            t('team_condition_2', [formatNum(currentTeamLevelRow?.pointSum ?? 0)])
          }}</div>
          <div class="mt-[0.12rem]">{{
            t('team_benefit_1', [
              formatNum(currentTeamLevelRow?.jrate ?? 0),
              formatNum(currentTeamLevelRow?.erate ?? 0),
              formatNum(currentTeamLevelRow?.brate ?? 0)
            ])
          }}</div>
        </div>
      </div>
      <!-- 个人信息：Cell 列表 -->
      <div class="mt-[0.32rem]">
        <div class="mb-[0.16rem] text-[0.28rem] font-bold text-white">{{
          t('personal_info_title')
        }}</div>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('uid_label')"
          :value="UserInfo.id"
          class="!rounded-sm mb-1"
        >
          <template #right-icon>
            <span class="cursor-pointer" @click="CopyText(UserInfo.id)">
              <Icon
                class="ml-0.5"
                class-prefix="exchange-icon"
                name="copy"
                :size="18"
                color="var(--van-text-color)"
              />
            </span>
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('nickname_label')"
          :value="UserInfo.nickname"
          class="!rounded-sm mb-1"
          is-link
          to="/UpgradeUserInfo?type=nickname"
        >
          <template #right-icon>
            <Icon class="ml-0.5" name="edit" :size="18" color="var(--van-text-color)" />
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('sex_label')"
          :value="UserInfo.sex === 1 ? t('sex_male') : t('sex_female')"
          class="!rounded-sm mb-1"
          is-link
          to="/UpgradeUserInfo?type=sex"
        >
          <template #right-icon>
            <Icon class="ml-0.5" name="edit" :size="18" color="var(--van-text-color)" />
          </template>
        </Cell>
        <Cell
          clickable
          center
          size="large"
          :border="false"
          :title="t('vip_level_label')"
          :value="UserInfo.level.name || 'VIP 1'"
          class="!rounded-sm mb-1"
        />
      </div>
    </div>
  </PageWrap>
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
  import Avatar from '/@/assets/images/avatar.png';
  import { NavBar, PageWrap } from '/@/components';
  import { updateUserInfo } from '/@/service/User';
  import { useMessage } from '/@/hooks/web/useMessage';
  import imageCompression from 'browser-image-compression';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { Cell, Icon, Image as VanImage, Uploader } from 'vant';

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
    border: 1px solid rgba(255, 255, 255, 0.42);
    background: rgba(5, 12, 35, 0.35);
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
