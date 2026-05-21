import qs from 'qs';
export * from './axiosTransform';
import { cloneDeep } from 'lodash-es';
import { isFunction } from '/@/utils/is';
import { AxiosCanceler } from './axiosCancel';
import { getAppEnvConfig } from '/@/utils/env';
import { RequestEnum } from '/@/enums/httpEnum';
import { EncryptParams } from '/@/utils/cipher';
import { ContentTypeEnum } from '/@/enums/httpEnum';
import type { CreateAxiosOptions } from './axiosTransform';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import type { RequestOptions, Result, UploadFileParams } from '/#/axios';
import type { AxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * @description:  axios module
 */
export class VAxios {
  private axiosInstance: AxiosInstance;
  private readonly options: CreateAxiosOptions;

  constructor(options: CreateAxiosOptions) {
    this.options = options;
    this.axiosInstance = axios.create(options);
    this.setupInterceptors();
  }

  /**
   * @description:  Create axios instance
   */
  private createAxios(config: CreateAxiosOptions): void {
    this.axiosInstance = axios.create(config);
  }

  private getTransform() {
    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const { transform } = this.options;
    return transform;
  }

  getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * @description: Reconfigure axios
   */
  configAxios(config: CreateAxiosOptions) {
    if (!this.axiosInstance) {
      return;
    }
    this.createAxios(config);
  }

  /**
   * @description: Set general header
   */
  setHeader(headers: any): void {
    if (!this.axiosInstance) {
      return;
    }
    Object.assign(this.axiosInstance.defaults.headers, headers);
  }

  /**
   * @description: Interceptor configuration
   */
  private setupInterceptors() {
    /** transform */
    const transform = this.getTransform();
    if (!transform) {
      return;
    }

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const {
      requestInterceptors,
      requestInterceptorsCatch,
      responseInterceptors,
      responseInterceptorsCatch
    } = transform;

    /** axiosCanceler */
    const axiosCanceler = new AxiosCanceler();

    // Request interceptor configuration processing（支持异步拦截器，如原生端读取 App/Device）
    this.axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      // If cancel repeat request is turned on, then cancel repeat request is prohibited
      // @ts-ignore
      const { ignoreCancelToken } = config.requestOptions;
      const ignoreCancel =
        ignoreCancelToken !== undefined
          ? ignoreCancelToken
          : this.options.requestOptions?.ignoreCancelToken;

      if (!ignoreCancel) {
        axiosCanceler.addPending(config);
      }
      if (requestInterceptors && isFunction(requestInterceptors)) {
        const next = requestInterceptors(config, this.options);
        config = next instanceof Promise ? await next : next;
      }
      return config;
    }, undefined);

    // Request interceptor error capture
    if (requestInterceptorsCatch && isFunction(requestInterceptorsCatch)) {
      this.axiosInstance.interceptors.request.use(undefined, requestInterceptorsCatch);
    }

    // Response result interceptor processing
    this.axiosInstance.interceptors.response.use((res: AxiosResponse<any>) => {
      if (res) {
        axiosCanceler.removePending(res.config);
      }
      if (responseInterceptors && isFunction(responseInterceptors)) {
        res = responseInterceptors(res);
      }
      return res;
    }, undefined);

    // Response result interceptor error capture
    if (responseInterceptorsCatch && isFunction(responseInterceptorsCatch)) {
      this.axiosInstance.interceptors.response.use(undefined, responseInterceptorsCatch);
    }
  }

  /**
   * @description:  File Upload
   */
  uploadFile<T = any>(config: AxiosRequestConfig, params: UploadFileParams) {
    /** 用户：UserStore */
    const UserStore = useUserStoreWithOut();

    /** formData */
    const formData = new window.FormData();

    /** customFilename */
    const customFilename = params.name || 'file';

    if (params.filename) {
      formData.append(customFilename, params.file, params.filename);
    } else {
      formData.append(customFilename, params.file);
    }

    if (params.data) {
      Object.keys(params.data).forEach((key) => {
        const value = params.data![key];
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formData.append(`${key}[]`, item);
          });
          return;
        }

        formData.append(key, params.data![key]);
      });
    }

    return this.request<T>({
      ...config,
      method: 'POST',
      data: formData,
      headers: {
        'Content-type': ContentTypeEnum.FORM_DATA,
        // @ts-ignore
        ignoreCancelToken: true,
        // Authorization
        Authorization: UserStore.getToken
      }
    });
  }

  // support form-data
  supportFormData(config: AxiosRequestConfig) {
    /** headers */
    const headers = config.headers || this.options.headers;

    /** contentType */
    const contentType = headers?.['Content-Type'] || headers?.['content-type'];

    if (
      contentType !== ContentTypeEnum.FORM_URLENCODED ||
      !Reflect.has(config, 'data') ||
      config.method?.toUpperCase() === RequestEnum.GET
    ) {
      return config;
    }

    return {
      ...config,
      data: qs.stringify(config.data, { arrayFormat: 'brackets' })
    };
  }

  Blob<T = any>(config: AxiosRequestConfig) {
    // 如果当前需要加密参数
    return this.request<T>(
      {
        ...config,
        method: 'POST',
        headers: {
          // @ts-ignore
          ignoreCancelToken: true,
          isTransformResponse: false
        },
        responseType: 'blob'
      },
      { isTransformResponse: false }
    );
  }

  get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'GET' }, options);
  }

  post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'POST' }, options);
  }

  put<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'PUT' }, options);
  }

  delete<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'DELETE' }, options);
  }

  request<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    /** conf */
    let conf: CreateAxiosOptions = cloneDeep(config);

    /** transform */
    const transform = this.getTransform();

    // 如果当前需要加密参数

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const { VITE_GLOB_ENCRYPT } = getAppEnvConfig();

    /** Encrypted */
    const Encrypted = Object.is(VITE_GLOB_ENCRYPT, true);
    if (Encrypted) {
      // 执行参数加密
      config.params = EncryptParams(qs.stringify(config.params, { encode: false }));
    }

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const { requestOptions } = this.options;

    /** opt */
    const opt: RequestOptions = Object.assign({}, requestOptions, options);

    /** 解构赋值：组合式 API 返回的一组方法或状态 */
    const { beforeRequestHook, requestCatchHook, transformRequestHook } = transform || {};
    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt);
    }
    conf.requestOptions = opt;

    conf = this.supportFormData(conf);

    return new Promise((resolve, reject) => {
      this.axiosInstance
        .request<any, AxiosResponse<Result>>(conf)
        .then((res: AxiosResponse<Result>) => {
          if (transformRequestHook && isFunction(transformRequestHook)) {
            try {
              const ret = transformRequestHook(res, opt);
              resolve(ret as T);
            } catch (err) {
              reject(err || new Error('request error!'));
            }
            return;
          }
          resolve(res as unknown as Promise<T>);
        })
        .catch((e: Error | AxiosError) => {
          if (requestCatchHook && isFunction(requestCatchHook)) {
            reject(requestCatchHook(e, opt));
            return;
          }
          if (axios.isAxiosError(e)) {
            // rewrite error message from axios in here
          }
          reject(e);
        });
    });
  }
}
