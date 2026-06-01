import type { AxiosInstance, AxiosError } from 'axios';

/**
 *  请求重试机制
 */

export class AxiosRetry {
  /**
   * 重试
   */
  retry(axiosInstance: AxiosInstance, error: AxiosError) {
    /** 配置：rawConfig */
    const rawConfig = error.response?.config;
    if (!rawConfig) {
      return Promise.reject(error);
    }

    /** 配置：config */
    const config = rawConfig as Recordable;

    /** 拉取接口数据：retryRequest */
    const retryRequest = config.requestOptions?.retryRequest as
      | { waitTime: number; count: number }
      | undefined;
    if (!retryRequest || retryRequest.count == null || retryRequest.waitTime == null) {
      return Promise.reject(error);
    }

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const { waitTime, count } = retryRequest;
    config.__retryCount = config.__retryCount || 0;
    if (config.__retryCount >= count) {
      return Promise.reject(error);
    }
    config.__retryCount += 1;
    //请求返回后config的header不正确造成重试请求失败,删除返回headers采用默认headers
    Reflect.deleteProperty(config, 'headers');
    return this.delay(waitTime).then(() => axiosInstance(config));
  }

  /**
   * 延迟
   */
  private delay(waitTime: number) {
    return new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
