import {
  completeMultipartUpload,
  initMultipartUpload,
  uploadMultipartChunk,

  /** FileRespVO：类型别名 */
  type FileRespVO
} from '/@/service/System';
import { isApiSuccess } from '/@/utils/apiResult';

/** 与文档示例一致：5MB/片，可由 init 响应覆盖 */
const DEFAULT_CHUNK_BYTES = 5 * 1024 * 1024;

/** 分片上传并发数（与后端 /multipart/upload 吞吐匹配，一般 3～5） */
const DEFAULT_CHUNK_CONCURRENCY = 4;

/** blobToBase64 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const i = dataUrl.indexOf(',');
      resolve(i >= 0 ? dataUrl.slice(i + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error ?? new Error('read chunk failed'));
    reader.readAsDataURL(blob);
  });
};

/** UploadVideoMultipartOptions：接口数据结构定义（拉取接口数据） */
export interface UploadVideoMultipartOptions {
  /** 业务目录，默认 video */
  directory?: string;
  /** 同时上传的分片数，默认 4，建议 3～5 */
  chunkConcurrency?: number;
  onProgress?: (
    percent: number,
    detail?: {
      uploadedChunks: number;
      totalChunks: number;
    }
  ) => void;
}

/** runPool */
const runPool =
  /** 固定并发池：按序提交任务，同时最多 `limit` 个 Promise 在执行 */
  async <T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> => {
    if (items.length === 0) return;
    const cap = Math.max(1, Math.min(limit, items.length));
    let next = 0;
    const workers = Array.from({ length: cap }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        await fn(items[i]);
      }
    });
    await Promise.all(workers);
  };

/** 拉取接口数据（uploadVideoMultipart） */
export const uploadVideoMultipart = async (
  file: File,
  opts: UploadVideoMultipartOptions = {}
): Promise<{
  url: string;
  file: FileRespVO;
}> => {
  /** chunkConcurrency */
  const chunkConcurrency =
    typeof opts.chunkConcurrency === 'number' && opts.chunkConcurrency > 0
      ? Math.floor(opts.chunkConcurrency)
      : DEFAULT_CHUNK_CONCURRENCY;

  /** filename */
  const filename = file.name || 'video.mp4';

  /** initRes */
  const initRes = await initMultipartUpload(
    {
      filename,
      fileSize: file.size,
      contentType: file.type || 'video/mp4',
      directory: opts.directory ?? 'video',
      chunkSize: DEFAULT_CHUNK_BYTES
    },
    { timeout: 0 }
  );
  if (!isApiSuccess(initRes)) {
    throw new Error(initRes?.msg || '初始化分片上传失败');
  }

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { fileId, uploadId, totalChunks, chunkSize: serverChunkSize } = initRes.data;

  /** chunkSize */
  const chunkSize = Number(serverChunkSize) > 0 ? Number(serverChunkSize) : DEFAULT_CHUNK_BYTES;

  /** 总条数：total */
  const total = Number(totalChunks);
  if (
    !uploadId ||
    !Number.isFinite(fileId) ||
    fileId <= 0 ||
    !Number.isFinite(total) ||
    total < 1
  ) {
    throw new Error('分片参数异常');
  }

  /** chunkIndices */
  const chunkIndices = Array.from({ length: total }, (_, i) => i + 1);

  /** completed */
  let completed = 0;
  await runPool(chunkIndices, chunkConcurrency, async (chunkIndex) => {
    const start = (chunkIndex - 1) * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);
    const chunkData = await blobToBase64(blob);
    const upRes = await uploadMultipartChunk(
      {
        fileId,
        uploadId,
        chunkIndex,
        chunkData
      },
      { timeout: 0 }
    );
    if (!isApiSuccess(upRes)) {
      throw new Error(upRes?.msg || `分片 ${chunkIndex}/${total} 上传失败`);
    }
    completed += 1;
    const prog = upRes.data?.progress;
    const uploadedChunks = upRes.data?.uploadedChunks;
    const totalChunksResp = upRes.data?.totalChunks ?? total;
    if (opts.onProgress) {
      if (typeof prog === 'number') {
        opts.onProgress(Math.min(100, Math.round(prog)), {
          uploadedChunks: typeof uploadedChunks === 'number' ? uploadedChunks : completed,
          totalChunks: totalChunksResp
        });
      } else {
        const approx = Math.round((completed / total) * 100);
        opts.onProgress(Math.min(100, approx), {
          uploadedChunks: completed,
          totalChunks: total
        });
      }
    }
  });

  /** doneRes */
  const doneRes = await completeMultipartUpload({ fileId, uploadId }, { timeout: 0 });
  if (!isApiSuccess(doneRes)) {
    throw new Error(doneRes?.msg || '合并分片失败');
  }

  /** meta */
  const meta = doneRes.data;

  /** url */
  const url = meta?.url;
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('未返回文件地址');
  }
  return { url: url.trim(), file: meta };
};
