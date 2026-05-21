import Avatar from '/@/assets/images/avatar.png';
import { useI18n } from '/@/hooks/web/useI18n';
import type { AppMarketingPostRespVO } from '/@/service/MarketingPost';

/** 列表展示项（由接口映射） */
export type CommunityPostItem = {
  id: number;
  userName: string;
  userAvatar: string;
  /** null 表示接口未给等级，勿与 0 混淆；仅 >0 展示徽章 */
  vipLevel: number | null;
  timeText: string;
  tags: string[];
  title: string;
  commentCount: number;
  likeCount: number;
  /** 当前用户是否已点赞（接口 isLiked） */
  liked: boolean;
  coverUrl: string;
  /** 封面 URL 是否为视频（picture/mediaUrl 可能是 mp4 等，不能用 VanImage） */
  coverIsVideo: boolean;
  showPlay: boolean;
  /** 1-视频 2-动态（与接口一致） */
  postType: number;
  /** postType===2 时多图 URL（仅图片，按 mediaSort 排序） */
  galleryImages: string[];
};

/** 格式化展示：formatRelativeTime */
export const formatRelativeTime = (raw: string | number | undefined | null): string => {
  const { t } = useI18n();
  if (raw === undefined || raw === null || raw === '') return '';
  const d =
    typeof raw === 'number'
      ? new Date(raw > 1e12 ? raw : raw * 1000)
      : new Date(String(raw).trim());
  if (Number.isNaN(d.getTime())) return typeof raw === 'string' ? raw : '';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return '';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return t('time_just_now');
  const min = Math.floor(sec / 60);
  if (min < 60) return t('num_minutes', [min]);
  const h = Math.floor(min / 60);
  if (h < 24) return t('num_hours', [h]);
  const day = Math.floor(h / 24);
  if (day < 30) return t('num_days', [day]);
  const mon = Math.floor(day / 30);
  if (mon < 12) return t('num_months_ago', [mon]);
  return t('num_years_ago', [Math.floor(day / 365)]);
};

/** 用户：pickUserVipLevel */
const pickUserVipLevel = (raw: AppMarketingPostRespVO): number | null => {
  const parse = (v: unknown): number | null => {
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
    const s = String(v).trim();
    if (!s || s === 'null' || s === 'undefined') return null;
    const n = parseInt(s, 10);
    if (!Number.isNaN(n)) return Math.max(0, n);
    const m = s.match(/(\d+)/);
    return m ? Math.max(0, parseInt(m[1], 10)) : null;
  };
  const r = raw as AppMarketingPostRespVO & Record<string, unknown>;
  const direct = r.userVipLevel ?? r.vipLevel ?? r.userVip ?? r.vip;
  if (direct !== undefined && direct !== null && direct !== '') {
    return parse(direct);
  }
  const u = r.user;
  if (u && typeof u === 'object') {
    const nested =
      (
        u as {
          vipLevel?: unknown;
        }
      ).vipLevel ??
      (
        u as {
          userVipLevel?: unknown;
        }
      ).userVipLevel ??
      (
        u as {
          vip?: unknown;
        }
      ).vip;
    if (nested !== undefined && nested !== null && nested !== '') return parse(nested);
  }
  return null;
};

/** isLikelyVideoUrl */
const isLikelyVideoUrl = (url: string): boolean => {
  if (!url?.trim()) return false;
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv|m3u8|3gp)$/i.test(path);
};

/** collectGalleryImageUrls */
const collectGalleryImageUrls = (raw: AppMarketingPostRespVO): string[] => {
  const list = raw.mediaList ?? [];
  const sorted = [...list].sort(
    (a, b) => (Number(a?.mediaSort) || 0) - (Number(b?.mediaSort) || 0)
  );
  const urls: string[] = [];
  for (const m of sorted) {
    const url = m?.mediaUrl?.trim();
    if (!url) continue;
    if (Number(m?.mediaType) === 2) continue;
    if (isLikelyVideoUrl(url)) continue;
    urls.push(url);
  }
  return urls;
};

/** mapPostToDisplay */
export const mapPostToDisplay = (raw: AppMarketingPostRespVO): CommunityPostItem => {
  const tags = (raw.tagList ?? [])
    .map((x) => {
      const n = x?.tagName?.trim();
      if (!n) return '';
      return n.startsWith('#') ? n : `#${n}`;
    })
    .filter(Boolean);
  const firstMedia = raw.mediaList?.[0];
  const pic = raw.picture?.trim();
  const mediaUrl = firstMedia?.mediaUrl?.trim();
  const mediaType = Number(firstMedia?.mediaType);
  const postType = Number(raw.postType);
  const postTypeNorm = Number.isFinite(postType) ? postType : 0;
  const galleryImages = postTypeNorm === 2 ? collectGalleryImageUrls(raw) : [];
  let coverUrl = '';
  let coverIsVideo = false;
  /** postType === 1 为视频帖：播放地址必须用 mediaList[0].mediaUrl（picture 多为静态封面图） */
  if (postTypeNorm === 1) {
    if (mediaUrl) {
      coverUrl = mediaUrl;
      coverIsVideo = true;
    } else if (pic) {
      coverUrl = pic;
      coverIsVideo = isLikelyVideoUrl(pic);
    }
  } else if (postTypeNorm === 2 && galleryImages.length > 0) {
    coverUrl = galleryImages[0];
    coverIsVideo = false;
  } else if (pic) {
    coverUrl = pic;
    coverIsVideo = isLikelyVideoUrl(pic);
  } else if (mediaUrl) {
    coverUrl = mediaUrl;
    coverIsVideo = mediaType === 2 || isLikelyVideoUrl(mediaUrl);
  }
  const isVideoPost = postTypeNorm === 1 || mediaType === 2;
  return {
    id: Number(raw.id),
    userName: raw.userNickname?.trim() || '--',
    userAvatar: raw.userAvatar?.trim() ? raw.userAvatar : Avatar,
    vipLevel: pickUserVipLevel(raw),
    timeText: formatRelativeTime(raw.createTime) || '--',
    tags,
    title: raw.title?.trim() || (raw.content?.trim() ?? '').slice(0, 120) || '--',
    commentCount: Number(raw.commentCount) || 0,
    likeCount: Number(raw.likeCount) || 0,
    liked: Boolean(raw.isLiked),
    coverUrl,
    coverIsVideo,
    showPlay: isVideoPost || coverIsVideo,
    postType: postTypeNorm,
    galleryImages
  };
};

/** mergePostsUnique */
export const mergePostsUnique = (
  prev: CommunityPostItem[],
  next: CommunityPostItem[],
  replace: boolean
) => {
  if (replace) return next;
  const seen = new Set(prev.map((p) => p.id));
  const merged = [...prev];
  for (const p of next) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
};
