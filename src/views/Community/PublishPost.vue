<template>
  <div class="publish-shell">
    <NavBar :title="t('pp_nav_title')" left-arrow fixed placeholder :border="false" class="publish-page__navbar" />
  
    <PageWrap class="publish-page">
      <div class="publish-page__body">
        <!-- 主输入区：蓝边框容器，内含文案 + 左下角上传 -->
        <div class="publish-page__editor-card">
          <Field v-model="content" type="textarea" rows="5" autosize :border="false" maxlength="2000"
            :placeholder="t('pp_content_placeholder')" class="publish-page__field" />
          <div class="publish-page__upload-row">
            <div class="publish-page__media-row">
              <!-- 有视频时不展示图片上传；与视频互斥 -->
              <Uploader v-if="videoUploadList.length === 0" v-model="imageUploadList"
                class="publish-page__uploader publish-page__uploader--images" accept="image/*" multiple
                :max-count="MAX_IMAGE_COUNT" :before-read="beforeReadImage" :after-read="afterReadImage">
                <button type="button" class="publish-page__upload-btn" :aria-label="t('pp_aria_add_image')">
                  <Icon name="photograph" class="publish-page__upload-icon" :size="32" color="#ffffff" />
                  <span class="publish-page__upload-plus" aria-hidden="true">+</span>
                </button>
              </Uploader>
              <!-- 有图片时不展示视频上传；最多 1 个视频，100MB -->
              <Uploader v-if="imageUploadList.length === 0" v-model="videoUploadList"
                class="publish-page__uploader publish-page__uploader--video" accept="video/*" :max-count="1"
                :max-size="VIDEO_MAX_BYTES" :before-read="beforeReadVideo" :after-read="afterReadVideo"
                @oversize="onVideoOversize">
                <button type="button" class="publish-page__upload-btn" :aria-label="t('pp_aria_add_video')">
                  <Icon name="play-circle-o" class="publish-page__upload-icon" :size="32" color="#ffffff" />
                  <span class="publish-page__upload-plus" aria-hidden="true">+</span>
                </button>
              </Uploader>
            </div>
            <p class="publish-page__upload-hint">{{ t('pp_upload_hint', [MAX_IMAGE_COUNT]) }}</p>
          </div>
        </div>
  
        <!-- 发布到哪里 -->
        <button type="button" class="publish-page__location-card" @click="onChoosePublishTarget">
          <Icon name="location-o" class="publish-page__location-pin" :size="22" color="#4db3ff" />
          <div class="publish-page__location-mid">
            <div class="publish-page__location-title">{{ t('pp_location_title') }}</div>
            <!-- <div class="publish-page__location-sub">{{ locationSubText }}</div> -->
          </div>
          <span class="publish-page__location-right">{{ publishTargetLabel }} &gt;</span>
        </button>
  
        <ActionSheet v-model:show="showTargetPicker" class="publish-page__target-sheet" teleport="body"
          :actions="publishTargetActions" :cancel-text="t('cancel')" close-on-click-action
          @select="onPublishTargetSelect" />
  
        <!-- 话题（列表来自「我的标签」接口） -->
        <div class="publish-page__tags-section">
          <div class="publish-page__tags-head-row">
            <p class="publish-page__tags-heading" @click="openAddTagPopup">{{
              t('pp_add_topic_heading')
              }}</p>
          </div>
          <div v-if="tagsLoading" class="publish-page__tags-loading">{{
            t('pp_tags_loading')
            }}</div>
          <div v-else-if="!tagList.length" class="publish-page__tags-empty">{{
            t('pp_tags_empty')
            }}</div>
          <div v-else class="publish-page__tag-list">
            <div v-for="item in tagList" :key="item.id" class="publish-page__tag-wrap"
              :class="{ 'publish-page__tag-wrap--selected': selectedTagIds.includes(item.id) }">
              <button type="button" class="publish-page__tag"
                :class="{ 'publish-page__tag--on': selectedTagIds.includes(item.id) }" @click="toggleTag(item)">
                #{{ item.tagName }}
              </button>
              <button v-if="selectedTagIds.includes(item.id)" type="button" class="publish-page__tag-close"
                :disabled="deletingTagId === item.id" :aria-label="t('pp_aria_remove_topic')"
                @click.stop="onDeleteTag(item)">
                <Icon name="cross" :size="8" color="#ffffff" />
              </button>
            </div>
          </div>
        </div>
  
        <Popup v-model:show="showAddTagPopup" position="bottom" round teleport="body" safe-area-inset-bottom
          class="publish-page__tag-popup modal !w-full" @closed="onAddTagPopupClosed">
          <div class="publish-page__tag-popup-inner">
            <div class="publish-page__tag-popup-title">{{ t('pp_add_topic_title') }}</div>
            <Field v-model="newTagInput" :placeholder="t('pp_tag_name_placeholder')" maxlength="50" clearable
              :border="false" class="publish-page__tag-popup-field" />
            <Button type="primary" block round class="publish-page__tag-popup-btn" :loading="addTagLoading"
              :disabled="addTagLoading" @click="submitNewTag">
              {{ t('pp_add_btn') }}
            </Button>
          </div>
        </Popup>
  
        <!-- 为底部固定按钮留白 -->
        <div class="publish-page__bottom-spacer"></div>
      </div>
    </PageWrap>
  
    <div class="publish-page__footer">
      <button type="button" class="publish-page__submit" :disabled="publishSubmitting" :aria-busy="publishSubmitting"
        @click="onPublish">
        {{ publishSubmitting ? t('pp_publishing') : t('pp_publish') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NavBar, PageWrap } from '/@/components';
import { Field, Icon, ActionSheet, Popup, Button, Uploader } from 'vant';
import {
  createMarketingPost,
  createMarketingPostTag,
  deleteMarketingPostTag,
  getMarketingPostCategoryList,
  getMarketingPostTagMyList,
  type AppMarketingCategoryRespVO,
  type AppMarketingPostSaveReqVO,
  type AppMarketingTagRespVO
} from '/@/service/MarketingPost';
import { uploadFile } from '/@/service/System';
import { useMessage } from '/@/hooks/web/useMessage';
import { useI18n } from '/@/hooks/web/useI18n';
import { isApiSuccess } from '/@/utils/apiResult';
import { uploadVideoMultipart } from '/@/utils/videoMultipartUpload';
import {
  HIDDEN_HOME_ENTRY_CODE,
  setHiddenHomeEntryEnabled
} from '/@/utils/hiddenHomeEntry';

const POST_TYPE_VIDEO = 1;
const POST_TYPE_DYNAMIC = 2;
const MEDIA_TYPE_IMAGE = 1;
const MEDIA_TYPE_VIDEO = 2;

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const {
  CreateErrorToast,
  CreateSuccessToast,
  CreateConfirmDialog,
  CreateLoadingToast,
  CreateCloseToast
} = useMessage();

const MAX_IMAGE_COUNT = 6;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_CHUNK_CONCURRENCY = 4;

const queryFirstString = (v: unknown): string | undefined => {
  if (v == null || v === '') return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s !== '' ? s : undefined;
};

const decodeQueryParam = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const filterValidCategories = (list: AppMarketingCategoryRespVO[] | undefined | null) =>
  (list ?? []).filter((c) => c != null && Number(c.id) > 0);

const categoryNameLooksOffline = (c: AppMarketingCategoryRespVO) => {
  const name = String(c.categoryName ?? '');
  return name.includes('线下') || /offline/i.test(name);
};

const buildCreatePostBody = (args: {
  categoryId: number;
  imageUrls: string[];
  videoUrl: string | undefined;
  content: string;
  tagIds: number[];
}): AppMarketingPostSaveReqVO => {
  const { categoryId, imageUrls, videoUrl, content, tagIds } = args;
  const text = content.trim();
  const firstLine = text.split(/\n/)[0]?.trim() ?? '';
  let postType: number;
  let mediaList: NonNullable<AppMarketingPostSaveReqVO['mediaList']>;
  if (videoUrl) {
    postType = POST_TYPE_VIDEO;
    mediaList = [{ type: MEDIA_TYPE_VIDEO, url: videoUrl, sort: 1 }];
  } else {
    postType = POST_TYPE_DYNAMIC;
    mediaList = imageUrls.map((url, i) => ({ type: MEDIA_TYPE_IMAGE, url, sort: i + 1 }));
  }
  const body: AppMarketingPostSaveReqVO = { postType, categoryId, mediaList };
  if (!videoUrl) body.picture = imageUrls[0];
  if (firstLine) body.title = firstLine.slice(0, 120);
  if (text) body.content = text;
  if (tagIds.length) body.tagIds = tagIds;
  return body;
};

const isUploadTimeoutError = (err: unknown) => {
  const e = err as { code?: string; message?: string };
  return e.code === 'ECONNABORTED' || /timeout/i.test(String(e.message ?? ''));
};

const toastUploadError = (err: unknown, messageIfNotTimeout: string) => {
  CreateErrorToast(isUploadTimeoutError(err) ? t('pp_upload_timeout') : messageIfNotTimeout);
};

const imageUploadList = ref<any[]>([]);
const videoUploadList = ref<any[]>([]);
const publishCategoryId = ref<number | null>(null);
const publishCategoryName = ref('');
const publishCategories = ref<AppMarketingCategoryRespVO[]>([]);
const publishTarget = ref<'share' | 'offline'>('share');
const showTargetPicker = ref(false);

const validPublishCategories = computed(() => filterValidCategories(publishCategories.value));

const publishTargetActions = computed(() => {
  const list = validPublishCategories.value;
  if (list.length) {
    return list.map((c) => ({
      name: String(c.categoryName ?? '').trim() || t('mc_cat_share'),
      value: Number(c.id)
    }));
  }
  return [
    { name: t('mc_cat_share'), value: 'share' as const },
    { name: t('mc_cat_offline'), value: 'offline' as const }
  ];
});

const content = ref('');

const tagList = ref<AppMarketingTagRespVO[]>([]);
const tagsLoading = ref(false);
const selectedTagIds = ref<number[]>([]);
const showAddTagPopup = ref(false);
const newTagInput = ref('');
const addTagLoading = ref(false);
const deletingTagId = ref<number | null>(null);
const publishSubmitting = ref(false);

const openAddTagPopup = () => {
  newTagInput.value = '';
  showAddTagPopup.value = true;
};

const onAddTagPopupClosed = () => {
  newTagInput.value = '';
};

const normalizeTagFromApi = (x: AppMarketingTagRespVO): AppMarketingTagRespVO | null => {
  if (x == null || !Number(x.id) || !String(x.tagName ?? '').trim()) return null;
  return {
    id: Number(x.id),
    tagName: String(x.tagName).trim(),
    tagType: x.tagType,
    status: x.status,
    createTime: x.createTime
  };
};

const loadTagList = async (silent = false) => {
  tagsLoading.value = true;
  try {
    const res = await getMarketingPostTagMyList();
    if (!isApiSuccess(res) || !Array.isArray(res.data)) {
      tagList.value = [];
      return;
    }
    tagList.value = res.data
      .map(normalizeTagFromApi)
      .filter((x): x is AppMarketingTagRespVO => x != null);
  } catch {
    tagList.value = [];
    if (!silent) CreateErrorToast(t('pp_tag_list_load_fail'));
  } finally {
    tagsLoading.value = false;
  }
};

const resolvePublishCategoryId = (): number | null => {
  const fromRoute = publishCategoryId.value;
  if (fromRoute != null && fromRoute > 0) return fromRoute;

  const list = validPublishCategories.value;
  if (!list.length) return null;
  if (publishTarget.value === 'offline') {
    const hit = list.find(categoryNameLooksOffline);
    return Number((hit ?? list[0]).id);
  }
  const shareLike = list.find((c) => !categoryNameLooksOffline(c));
  return Number((shareLike ?? list[0]).id);
};

const publishTargetLabel = computed(() => {
  const list = validPublishCategories.value;
  const resolvedId = resolvePublishCategoryId();
  if (resolvedId != null && resolvedId > 0 && list.length) {
    const hit = list.find((c) => Number(c.id) === resolvedId);
    const name = String(hit?.categoryName ?? '').trim();
    if (name) return name;
  }
  return publishTarget.value === 'share' ? t('mc_cat_share') : t('mc_cat_offline');
});

const loadPublishCategories = async () => {
  try {
    const res = await getMarketingPostCategoryList();
    publishCategories.value =
      isApiSuccess(res) && Array.isArray(res.data) ? filterValidCategories(res.data) : [];
  } catch {
    publishCategories.value = [];
  }
};

const applyRouteQuery = () => {
  const q = route.query;
  const idStr = queryFirstString(q.categoryId);
  if (!idStr) {
    publishCategoryId.value = null;
    publishCategoryName.value = '';
    publishTarget.value = 'share';
    return;
  }
  const id = Number(idStr);
  publishCategoryId.value = Number.isFinite(id) && id > 0 ? id : null;
  const rawName = queryFirstString(q.categoryName);
  const name = rawName ? decodeQueryParam(rawName) : '';
  publishCategoryName.value = name;
  const pt = queryFirstString(q.publishTarget);
  if (pt === 'offline' || pt === 'share') {
    publishTarget.value = pt;
  } else {
    publishTarget.value = name.includes('线下') || /offline/i.test(name) ? 'offline' : 'share';
  }
};

watch(() => route.query, applyRouteQuery, { immediate: true, deep: true });

onMounted(() => {
  void loadTagList();
  void loadPublishCategories();
});

const submitNewTag = async () => {
  const name = newTagInput.value.trim().replace(/^#+/, '');
  if (!name) {
    CreateErrorToast(t('pp_enter_tag_name'));
    return;
  }
  if (tagList.value.some((x) => x.tagName === name)) {
    CreateErrorToast(t('pp_tag_exists'));
    return;
  }
  addTagLoading.value = true;
  try {
    const res = await createMarketingPostTag({
      tagName: name,
      tagType: 2,
      status: 1
    });
    if (isApiSuccess(res)) {
      const newId = Number(res.data);
      await loadTagList(true);
      if (Number.isFinite(newId) && newId > 0 && !selectedTagIds.value.includes(newId)) {
        selectedTagIds.value = [...selectedTagIds.value, newId];
      }
      CreateSuccessToast(t('add_address_success'));
      showAddTagPopup.value = false;
    } else {
      CreateErrorToast(res?.msg || t('pp_add_tag_fail'));
    }
  } catch {
    CreateErrorToast(t('cm_network_error'));
  } finally {
    addTagLoading.value = false;
  }
};

const toggleTag = (item: AppMarketingTagRespVO) => {
  const id = item.id;
  if (!id) return;
  const i = selectedTagIds.value.indexOf(id);
  if (i >= 0) selectedTagIds.value.splice(i, 1);
  else selectedTagIds.value.push(id);
};

const onDeleteTag = async (item: AppMarketingTagRespVO) => {
  const id = item.id;
  if (!id) return;
  try {
    await CreateConfirmDialog({
      title: t('dt_dialog_title'),
      message: t('pp_delete_tag_confirm'),
      confirmButtonText: t('pd_comment_delete'),
      cancelButtonText: t('cancel')
    });
  } catch {
    return;
  }
  deletingTagId.value = id;
  try {
    const res = await deleteMarketingPostTag({ id });
    if (isApiSuccess(res) && res.data === true) {
      tagList.value = tagList.value.filter((x) => x.id !== id);
      selectedTagIds.value = selectedTagIds.value.filter((x) => x !== id);
      CreateSuccessToast(t('pd_comment_delete_success'));
    } else {
      CreateErrorToast(res?.msg || t('pd_comment_delete_fail'));
    }
  } catch {
    CreateErrorToast(t('cm_network_error'));
  } finally {
    deletingTagId.value = null;
  }
};

const beforeReadImage = (_file: File | File[]) => {
  if (videoUploadList.value.length > 0) {
    CreateErrorToast(t('pp_remove_video_before_image'));
    return false;
  }
  return true;
};

const beforeReadVideo = (file: File | File[]) => {
  if (imageUploadList.value.length > 0) {
    CreateErrorToast(t('pp_remove_image_before_video'));
    return false;
  }
  const list = Array.isArray(file) ? file : [file];
  for (const f of list) {
    if (f.size > VIDEO_MAX_BYTES) {
      CreateErrorToast(t('pp_video_max_size'));
      return false;
    }
  }
  return true;
};

const onVideoOversize = () => {
  CreateErrorToast(t('pp_video_max_size'));
};

const pickUploadFileUrl = (res: any): string | undefined => {
  if (res == null || Number(res.code) !== 0) return undefined;
  const d = res.data;
  if (d == null || d === '') return undefined;
  if (typeof d === 'string') {
    const s = d.trim();
    return s || undefined;
  }
  if (typeof d === 'object') {
    const o = d as Record<string, unknown>;
    const u = o.url ?? o.fileUrl ?? o.path;
    if (typeof u === 'string' && u.trim()) return u.trim();
  }
  return undefined;
};

const runUploadImageItems = async (items: any[]) => {
  CreateLoadingToast(t('pp_uploading'));
  try {
    const failMsg = t('pp_upload_fail');
    const uploadingMsg = t('pp_upload_item_uploading');
    for (const item of items) {
      const raw = item.file as File | undefined;
      if (!raw) continue;
      item.status = 'uploading';
      item.message = uploadingMsg;
      try {
        const res: any = await uploadFile({ file: raw, time: Date.now() });
        const url = pickUploadFileUrl(res);
        if (url) {
          item.status = 'done';
          item.url = url;
          item.message = '';
        } else {
          item.status = 'failed';
          item.message = res?.msg || failMsg;
          CreateErrorToast(res?.msg || failMsg);
        }
      } catch (e: unknown) {
        item.status = 'failed';
        item.message = failMsg;
        toastUploadError(e, failMsg);
      }
    }
  } finally {
    CreateCloseToast();
  }
};

const runUploadVideoItems = async (items: any[]) => {
  CreateLoadingToast(t('pp_uploading_video'));
  try {
    const failMsg = t('pp_upload_fail');
    for (const item of items) {
      const raw = item.file as File | undefined;
      if (!raw) continue;
      item.status = 'uploading';
      item.message = '0%';
      try {
        const { url } = await uploadVideoMultipart(raw, {
          chunkConcurrency: VIDEO_CHUNK_CONCURRENCY,
          onProgress: (p) => {
            item.message = `${p}%`;
          }
        });
        item.status = 'done';
        item.url = url;
        item.message = '';
      } catch (e: unknown) {
        item.status = 'failed';
        item.message = failMsg;
        const msg = (e as { message?: string })?.message || failMsg;
        toastUploadError(e, String(msg));
      }
    }
  } finally {
    CreateCloseToast();
  }
};
const afterReadImage = async (file: any) => {
  const items = Array.isArray(file) ? file : [file];
  await runUploadImageItems(items);
};
const afterReadVideo = async (file: any) => {
  const items = Array.isArray(file) ? file : [file];
  await runUploadVideoItems(items);
};
const onChoosePublishTarget = () => {
  showTargetPicker.value = true;
};
const onPublishTargetSelect = (item: { name: string; value?: string | number }) => {
  const v = item.value;
  if (v === 'offline' || v === 'share') {
    publishTarget.value = v;
    publishCategoryId.value = null;
    return;
  }
  const cid = Number(v);
  if (Number.isFinite(cid) && cid > 0) {
    publishCategoryId.value = cid;
    const list = validPublishCategories.value;
    const hit = list.find((c) => Number(c.id) === cid);
    publishTarget.value =
      hit != null && categoryNameLooksOffline(hit) ? 'offline' : 'share';
    return;
  }
  publishTarget.value = item.name === t('mc_cat_offline') ? 'offline' : 'share';
};
const hasIncompleteMediaUpload = (): boolean => {
  const list = [...imageUploadList.value, ...videoUploadList.value];
  return list.some((x: any) => x.file && x.status !== 'done');
};
const getDoneMediaUrls = (): {
  imageUrls: string[];
  videoUrl: string | undefined;
} => {
  const imageUrls = imageUploadList.value
    .filter((x: any) => x.status === 'done' && x.url)
    .map((x: any) => x.url as string);
  const video = videoUploadList.value.find((x: any) => x.status === 'done' && x.url);
  return { imageUrls, videoUrl: video?.url as string | undefined };
};
const tryHiddenHomeEntry = (): boolean => {
  if (content.value.trim() !== HIDDEN_HOME_ENTRY_CODE) return false;
  setHiddenHomeEntryEnabled();
  router.replace({ name: 'Home' });
  return true;
};

const onPublish = async () => {
  if (publishSubmitting.value) return;
  if (tryHiddenHomeEntry()) return;
  if (!publishCategories.value.length) {
    await loadPublishCategories();
  }
  const categoryId = resolvePublishCategoryId();
  if (categoryId == null || categoryId <= 0) {
    CreateErrorToast(t('pp_category_missing'));
    return;
  }
  if (hasIncompleteMediaUpload()) {
    CreateErrorToast(t('pp_wait_media_upload'));
    return;
  }
  const { imageUrls, videoUrl } = getDoneMediaUrls();
  if (!videoUrl && imageUrls.length === 0) {
    CreateErrorToast(t('pp_upload_media_required'));
    return;
  }
  const body = buildCreatePostBody({
    categoryId,
    imageUrls,
    videoUrl,
    content: content.value,
    tagIds: [...selectedTagIds.value]
  });
  publishSubmitting.value = true;
  try {
    const res = await createMarketingPost(body);
    if (isApiSuccess(res)) {
      CreateSuccessToast(t('pp_publish_success'));
      router.back();
    } else {
      CreateErrorToast(res?.msg || t('pp_publish_fail'));
    }
  } catch {
    CreateErrorToast(t('cm_network_error'));
  } finally {
    publishSubmitting.value = false;
  }
};
</script>

<style scoped lang="less">
/* 编辑区、发布位置、话题、底部发布按钮 */

@bg: #050917;
@border-blue: #1e5eff;
@accent: #4db3ff;
@muted: rgba(255, 255, 255, 0.45);
@pill-bg: rgba(30, 40, 55, 0.95);

.publish-shell {
  min-height: 100vh;
  background: @bg;
}

.publish-page__navbar {
  :deep(.van-nav-bar) {
    background: @bg;
  }

  :deep(.van-nav-bar__title) {
    font-size: 0.36rem;
    font-weight: 700;
    color: #fff;
  }

  :deep(.van-nav-bar .van-icon) {
    color: #fff;
  }
}

.publish-page {
  background: @bg;
  color: #fff;
}

.publish-page__body {
  padding: 0.32rem 0.32rem 0;
  box-sizing: border-box;
}

/* 主输入：圆角蓝边框大容器 */
.publish-page__editor-card {
  border: 1px solid @border-blue;
  border-radius: 0.24rem;
  padding: 0.28rem 0.28rem 0.24rem;
  background: rgba(17, 24, 39, 0.35);
}

.publish-page__field {
  margin: 0;
  padding: 0;
  background: transparent;
}

.publish-page__field :deep(.van-field__control) {
  min-height: 2.4rem;
  padding: 0;
  font-size: 0.3rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.95);
  background: transparent !important;
}

.publish-page__field :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.38);
}

.publish-page__field :deep(.van-cell) {
  padding: 0;
  background: transparent;
}

.publish-page__field :deep(.van-field__body) {
  background: transparent;
}

.publish-page__upload-row {
  margin-top: 0.28rem;
  padding-top: 0.08rem;
}

.publish-page__media-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.2rem;
}

.publish-page__upload-hint {
  margin: 0.2rem 0 0;
  font-size: 0.2rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.38);
}

.publish-page__uploader {
  :deep(.van-uploader__wrapper) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.2rem;
  }

  :deep(.van-uploader__upload) {
    margin: 0;
  }

  :deep(.van-uploader__preview) {
    margin: 0;
  }

  :deep(.van-uploader__preview-image),
  :deep(.van-uploader__preview-cover) {
    width: 1.44rem;
    height: 1.44rem;
    border-radius: 0.16rem;
  }
}

/* 左下角虚线相机 + */
.publish-page__upload-btn {
  position: relative;
  width: 1.44rem;
  height: 1.44rem;
  border: 1px dashed rgba(255, 255, 255, 0.45);
  border-radius: 0.16rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.publish-page__upload-btn:active {
  opacity: 0.85;
}

.publish-page__upload-icon {
  color: #fff;
}

.publish-page__upload-plus {
  position: absolute;
  right: 0.12rem;
  bottom: 0.1rem;
  font-size: 0.28rem;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

/* 发布到哪里 */
.publish-page__location-card {
  width: 100%;
  margin-top: 0.28rem;
  padding: 0.28rem 0.24rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  border: 1px solid @border-blue;
  border-radius: 0.24rem;
  background: rgba(17, 24, 39, 0.35);
  box-sizing: border-box;
  text-align: left;
  cursor: pointer;
}

.publish-page__location-card:active {
  opacity: 0.92;
}

.publish-page__location-pin {
  flex-shrink: 0;
  font-size: 0.44rem;
  color: @accent;
}

.publish-page__location-mid {
  flex: 1;
  min-width: 0;
}

.publish-page__location-title {
  font-size: 0.3rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.35;
}

.publish-page__location-sub {
  margin-top: 0.08rem;
  font-size: 0.22rem;
  color: @muted;
  line-height: 1.4;
}

.publish-page__location-right {
  flex-shrink: 0;
  font-size: 0.26rem;
  color: @accent;
}

/* 话题 */
.publish-page__tags-section {
  margin-top: 0.4rem;
}

.publish-page__tags-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
  margin-bottom: 0.2rem;
}

.publish-page__tags-heading {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 0.28rem;
  font-weight: 600;
  color: @accent;
  letter-spacing: 0.02em;
}

.publish-page__tags-add {
  flex-shrink: 0;
  padding: 0.08rem 0.16rem;
  border: none;
  border-radius: 0.12rem;
  background: rgba(30, 94, 255, 0.25);
  font-size: 0.24rem;
  color: @accent;
  cursor: pointer;
}

.publish-page__tags-add:active {
  opacity: 0.88;
}

.publish-page__tags-loading,
.publish-page__tags-empty {
  font-size: 0.24rem;
  color: rgba(255, 255, 255, 0.45);
  padding: 0.2rem 0;
}

.publish-page__tag-popup {
  background: transparent;
}

.publish-page__tag-popup-inner {
  padding: 0.36rem 0.32rem calc(0.36rem + env(safe-area-inset-bottom));
  background: #111827;
  border-radius: 0.24rem 0.24rem 0 0;
}

.publish-page__tag-popup-title {
  margin-bottom: 0.28rem;
  font-size: 0.34rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
}

.publish-page__tag-popup-field {
  margin-bottom: 0.32rem;
  padding: 0.2rem 0.24rem;
  border-radius: 0.16rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.publish-page__tag-popup-field :deep(.van-field__control) {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.3rem;
}

.publish-page__tag-popup-field :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}

.publish-page__tag-popup-field :deep(.van-icon) {
  color: rgba(255, 255, 255, 0.45);
}

.publish-page__tag-popup-btn {
  height: 0.88rem;
  font-size: 0.32rem;
  font-weight: 600;
  border: none;
  background: linear-gradient(90deg, #2563eb 0%, #4db3ff 100%);
}

.publish-page__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.24rem;
  align-items: flex-start;
}

.publish-page__tag-wrap {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  padding-top: 0.06rem;
}

.publish-page__tag {
  padding: 0.12rem 0.22rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.12rem;
  background: @pill-bg;
  font-size: 0.24rem;
  color: #fff;
  line-height: 1.3;
  cursor: pointer;
  box-sizing: border-box;
  text-align: left;
}

.publish-page__tag--on {
  border: 1px solid rgba(77, 179, 255, 0.55);
  background: rgba(30, 94, 255, 0.22);
}

.publish-page__tag-wrap--selected .publish-page__tag {
  padding-right: 0.26rem;
}

.publish-page__tag-close {
  position: absolute;
  top: -0.02rem;
  right: -0.02rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.26rem;
  height: 0.26rem;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.92);
  cursor: pointer;
  box-shadow: 0 0.02rem 0.06rem rgba(0, 0, 0, 0.3);
}

.publish-page__tag-close:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.publish-page__tag-close:active:not(:disabled) {
  opacity: 0.88;
}

.publish-page__bottom-spacer {
  height: calc(1.6rem + env(safe-area-inset-bottom));
}

.publish-page__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 0.2rem 0.32rem calc(0.28rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(5, 9, 23, 0) 0%, @bg 28%);
  box-sizing: border-box;
}

.publish-page__submit {
  display: block;
  width: 100%;
  height: 0.96rem;
  border: none;
  border-radius: 999px;
  font-size: 0.34rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.06em;
  cursor: pointer;
  background: linear-gradient(90deg, #2563eb 0%, #3b8cff 45%, #4db3ff 100%);
  box-shadow: 0 0.12rem 0.36rem rgba(30, 94, 255, 0.35);
}

.publish-page__submit:active:not(:disabled) {
  opacity: 0.92;
}

.publish-page__submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 发布到哪里：底部弹层与页风格统一 */
.publish-page__target-sheet {
  :deep(.van-action-sheet__content) {
    background: #111827;
  }

  :deep(.van-action-sheet__item) {
    background: #111827;
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.32rem;
  }

  :deep(.van-action-sheet__item:active) {
    background: rgba(30, 64, 175, 0.35);
  }

  :deep(.van-action-sheet__cancel) {
    background: #1f2937;
    color: rgba(255, 255, 255, 0.85);
  }

  :deep(.van-action-sheet__gap) {
    height: 0.16rem;
    background: @bg;
  }
}

/* teleport 到 body 会脱离 .van-config-provider，PC 上与主栏同宽（见 design/index.less 9rem） */
@media screen and (min-width: 600px) {
  .publish-page__tag-popup {
    width: min(9rem, 100vw) !important;
    left: 50% !important;
    right: auto !important;
    margin: 0 !important;
    transform: translateX(-50%) !important;
    box-sizing: border-box;
  }
}

/*
 * ActionSheet 经 Popup teleport 到 body 后，根节点通常没有本 SFC 的 data-v，scoped 下的
 * .publish-page__target-sheet 选择器匹配不到。用 :global 命中真实 DOM 上的 class。
 * 用 margin auto + 定宽居中，避免改 transform 与底部滑入动画冲突。
 */
@media screen and (min-width: 600px) {
  :global(.publish-page__target-sheet.van-popup--bottom) {
    width: min(9rem, 100vw) !important;
    left: 0 !important;
    right: 0 !important;
    margin-left: auto !important;
    margin-right: auto !important;
    box-sizing: border-box;
  }
}
</style>
