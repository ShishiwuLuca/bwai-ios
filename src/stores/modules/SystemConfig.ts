import { store } from '/@/stores';
import { defineStore } from 'pinia';
import { deepMerge } from '/@/utils';
// import { i18n } from '/@/locales/setupI18n';
import { ThemeEnum } from '/@/enums/appEnum';
import { setWebSiteContent } from '/@/utils';
import { getAppEnvConfig } from '/@/utils/env';
import { isNative } from '/@/hooks/useAppInfo';
import { useLocale } from '/@/locales/useLocale';
import { useUserStoreWithOut } from './UserConfig';
import { localeList } from '/@/settings/localeSetting';
import { setVantLocales } from '/@/locales/VantLocale';
import { updateDarkTheme } from '/@/logics/theme/dark';
import { localeSetting } from '/@/settings/localeSetting';
import { updateGrayMode } from '/@/logics/theme/updateGrayMode';
import { updateColorWeak } from '/@/logics/theme/updateColorWeak';
import { APP_PRESET_COLOR_LIST } from '/@/settings/projectSetting';
import type { LocaleSetting, LocaleType, ProjectConfig } from '/#/config';
import { getSystemConfig, getCountryList, getFiatExchangeRate } from '/@/service/System';

/** 解构赋值：组合式 API 返回的一组方法或状态 */
const { VITE_GLOB_APP_TITLE } = getAppEnvConfig();

/** 服务端版本检测：更新类型（与接口 `updateType` 一致） */
export type AppUpdateDialogUpdateType = 'resource' | 'package';

/** 服务端版本检测通过后展示的升级弹窗数据 */
export interface AppUpdateDialogPayload {
  currentVersion: string;
  newVersion: string;
  contentList: string[];
  forceUpdate: boolean;
  /** 接口 `updateType`：resource 资源包 / package 安装包 */
  updateType?: AppUpdateDialogUpdateType;
  /** 接口 `downloadUrl`：安装包或资源包下载地址 */
  downloadUrl?: string;
  /** 接口 `version`：目标更新版本号（OTA 与展示兜底） */
  serverVersion?: string;
  androidApkUrl?: string;
  iosStoreUrl?: string;
  iosAppStoreId?: string;
}

/** 升级弹窗内展示的下载进度（MB 两位小数由调用方格式化） */
export interface AppUpdateDownloadProgressState {
  active: boolean;
  percent: number;
  loadedMb: string;
  totalMb: string;
}

// 配置名称Key

/** StoreKeyName：APP 端使用固定前缀 `App`，避免 WebView 中 `location.host` 与 H5 不一致 */
const StoreKeyName = (isNative ? 'App' : location.host) + '_' + VITE_GLOB_APP_TITLE + '_System';

// State类型控制

/** SystemState：接口数据结构定义 */
interface SystemState {
  // 国际化语言
  localInfo: any;
  // 项目配置
  projectConfig: ProjectConfig | any;
  // UI库主题变量配置
  themeVars: object;
  // 加载动画状态
  Loading: boolean;
  // 语言列表
  LocaleList: any[];
  // 所有币种
  CoinList: any[];
  // 加载成功的语言包
  LoadErrorLocales: any[];
  // 服务端语言包缓存（持久化）
  ServerLocaleCache: Record<string, any>;
  // 语言包版本号缓存（持久化）
  LocaleVersionCache: Record<string, string>;
  // 服务端语言包版本列表
  ServiceLocaleVersion: any[];
  // 是否 APP 环境
  isApp?: boolean;
  // 币种汇率等（ContractUtils 等使用）
  SymbolRate?: Record<string, unknown>;
  // APP 升级弹窗是否显示
  showAppUpdateDialog: boolean;
  /** 升级弹窗展示数据（由服务端 checkVersion 结果填充） */
  appUpdateDialogPayload: AppUpdateDialogPayload | null;
  /** 升级下载进度（弹窗内展示） */
  appUpdateDownloadProgress: AppUpdateDownloadProgressState | null;
  // 国家区号列表
  CountryList: any[];
  // 默认的国家区号信息
  DefaultCountryInfo: any;
  // 法币汇率：key 为 quoteCurrency，值为 rate
  FiatExchangeRate: Record<string, number>;
  // 网络类型列表
  NetworkTypeList: any[];
  // 网络币种列表
  NetworkCoinList: any[];
}

// 导出系统配置

/** useSystemStore */
export const useSystemStore = defineStore(StoreKeyName, {
  state: (): SystemState => ({
    // 国际化语言
    localInfo: {},
    // 项目配置
    projectConfig: {},
    // UI库主题变量配置
    themeVars: {},
    // 加载动画状态
    Loading: true,
    // 语言列表
    LocaleList: [],
    // 所有币种
    CoinList: [],
    // 加载成功的语言包
    LoadErrorLocales: [],
    // 服务端语言包缓存（持久化）
    ServerLocaleCache: {},
    // 语言包版本号缓存（持久化）
    LocaleVersionCache: {},
    // 服务端语言包版本列表
    ServiceLocaleVersion: [],
    // 是否 APP 环境
    isApp: false,
    // 币种汇率（ContractUtils 等使用）
    SymbolRate: {} as Record<string, unknown>,
    // APP 升级弹窗是否显示
    showAppUpdateDialog: false,
    appUpdateDialogPayload: null,
    appUpdateDownloadProgress: null,
    // 国家区号列表
    CountryList: [],
    // 默认的国家区号信息
    DefaultCountryInfo: {},
    // 法币汇率
    FiatExchangeRate: {},
    // 网络类型列表
    NetworkTypeList: [],
    // 网络币种列表
    NetworkCoinList: []
  }),
  // getters
  getters: {
    // 获取主题模式
    getDarkMode(): ThemeEnum.LIGHT | ThemeEnum.DARK {
      return (this.projectConfig as ProjectConfig).themeDark || ThemeEnum.DARK;
    },
    // 获取主题颜色
    getThemeColor(): object {
      return (
        (this.projectConfig as ProjectConfig).themeColor ||
        (APP_PRESET_COLOR_LIST[0] as unknown as object)
      );
    },
    // 获取当前语言
    getLocaleInfo(): LocaleSetting {
      return this.localInfo || localeSetting;
    },
    // 获取UI库主题变量配置
    getThemeVars(): any {
      return this.themeVars || {};
    },
    // 获取色弱模式状态
    getColorWeak(): boolean {
      return (this.projectConfig as ProjectConfig).colorWeak || false;
    },
    // 获取灰色模式状态
    getGrayMode(): boolean {
      return (this.projectConfig as ProjectConfig).grayMode || false;
    },
    // 获取加载动画状态
    getLoading(): boolean {
      return this.Loading || true;
    },
    // 获取语言列表
    getLocaleList(): any[] {
      return this.LocaleList || [];
    },
    // 获取客服链接
    getCustomerService(): string {
      return this.projectConfig.CustomerService || '';
    },
    // 获取所有币种
    getCoinList(): any[] {
      return this.CoinList || [];
    },
    // 获取加载成功的语言包列表
    getLoadErrorLocales(): any[] {
      return this.LoadErrorLocales;
    },
    // 获取语言包版本号缓存
    getLocaleVersionCache(): Record<string, string> {
      return this.LocaleVersionCache || {};
    },
    // 服务端语言包版本列表
    getServiceLocaleVersion(): any[] {
      return this.ServiceLocaleVersion || [];
    },
    // 获取国家区号列表
    getCountryList(): any[] {
      return this.CountryList || [];
    },
    // 获取默认的国家区号信息
    getDefaultCountryInfo(): any {
      return this.DefaultCountryInfo || {};
    },
    // 获取法币汇率
    getFiatExchangeRate(): Record<string, number> {
      return this.FiatExchangeRate || {};
    },
    // 获取网络类型列表
    getNetworkTypeList(): any[] {
      return this.NetworkTypeList || [];
    },
    // 获取网络币种列表
    getNetworkCoinList(): any[] {
      return this.NetworkCoinList || [];
    },
    // 获取安卓APP下载地址
    getAndroidPackageUrl(): string {
      return this.projectConfig.AndroidDownloadUrl || '';
    },
    // 获取iOS APP下载地址
    getIosPackageUrl(): string {
      return this.projectConfig.IosDownloadUrl || '';
    },
    // 获取站点Logo
    getSiteLogo(): string {
      return this.projectConfig.Logo || '';
    },
    // 获取站点名称
    getSiteName(): string {
      return this.projectConfig.SiteName || '';
    },
    // 获取H5地址
    getWebPath(): string {
      return this.projectConfig.WebPath || '';
    },
    // 获取登录页Logo
    getLoginLogo(): string {
      return this.projectConfig.LoginLogo || '';
    },
    // 获取注册页Logo
    getRegisterLogo(): string {
      return this.projectConfig.RegisterLogo || '';
    }
  },
  // actions
  actions: {
    // 设置是否 APP 环境
    setIsApp(payload: boolean): void {
      this.isApp = payload;
    },
    // 设置 APP 升级弹窗是否显示（强制更新时忽略「关闭」类调用，除非 bypassForceGuard）
    setShowAppUpdateDialog(
      payload: boolean,
      options?: {
        bypassForceGuard?: boolean;
      }
    ): void {
      if (
        !payload &&
        this.appUpdateDialogPayload?.forceUpdate === true &&
        !options?.bypassForceGuard
      ) {
        return;
      }
      this.showAppUpdateDialog = payload;
      if (!payload) {
        this.appUpdateDialogPayload = null;
        this.appUpdateDownloadProgress = null;
      }
    },
    setAppUpdateDownloadProgress(progress: AppUpdateDownloadProgressState | null): void {
      this.appUpdateDownloadProgress = progress;
    },
    /** 打开升级弹窗并写入展示数据 */
    openAppUpdateDialog(dialogPayload: AppUpdateDialogPayload): void {
      this.appUpdateDownloadProgress = null;
      this.appUpdateDialogPayload = dialogPayload;
      this.showAppUpdateDialog = true;
    },
    // 修改主题模式
    setDarkMode(payload: ThemeEnum): void {
      (this.projectConfig as ProjectConfig).themeDark = payload;
      updateDarkTheme(payload);
    },
    // 保存语言
    setLocaleInfo(payload: Partial<LocaleSetting>): void {
      this.localInfo = { ...this.localInfo, ...payload };
      // 切换Vant UI库语言
      setVantLocales(this.localInfo.locale);
      const UserStore = useUserStoreWithOut();
      // 如果需要设置倒置
      if (
        this.localInfo.locale.startsWith('ar_AE') ||
        this.localInfo.locale.startsWith('fa_IR') ||
        this.localInfo.locale.startsWith('ur_PK')
      ) {
        UserStore.setIsRTL(true);
      } else {
        UserStore.setIsRTL(false);
      }
    },
    // 保存基础配置数据
    setProjectConfig(payload: DeepPartial<ProjectConfig>): void {
      this.projectConfig = deepMerge(this.projectConfig || {}, payload);
    },
    // 更新UI库主题变量配置
    setThemeVars(payload: any): void {
      this.themeVars = payload;
    },
    // 修改主题色
    setThemeColor(payload: any): void {
      (this.projectConfig as ProjectConfig).themeColor = payload;
    },
    // 网站灰色模式
    setGrayMode(payload: boolean): void {
      (this.projectConfig as ProjectConfig).grayMode = payload;
      updateGrayMode(payload);
    },
    // 色弱模式
    setColorWeak(payload: boolean): void {
      (this.projectConfig as ProjectConfig).colorWeak = payload;
      updateColorWeak(payload);
    },
    // 保存加载动画状态
    setLoading(payload: boolean): void {
      // 如果是关闭
      if (payload === false) {
        // 延迟500毫秒关闭防止页面未渲染完成
        setTimeout(() => {
          this.Loading = payload;
        }, 500);
      } else {
        this.Loading = payload;
      }
    },
    // 保存语言列表
    async setLocaleList(payload: any[]): Promise<void> {
      // 保存服务端的语言列表
      this.LocaleList = payload;
      // 获取当前设置语言类型的语言配置包
      let LocalePath = payload.filter((item: any) => item.value === this.localInfo.locale)[0];
      // 如果服务端语言列表中不包含当前使用的语言则使用默认的语言
      if (!LocalePath) {
        LocalePath = payload.filter((item: any) => item.checked === true)[0];
        this.setLocaleInfo(LocalePath);
      }
    },
    // 保存所有币种
    setCoinList(payload: any[]): void {
      this.CoinList = payload;
    },
    // 获取系统配置
    async setSystemConfigData() {
      // const UserStore = useUserStoreWithOut();
      getSystemConfig({ lang: this.localInfo.locale }).then(async (res: any) => {
        const { code } = res;
        if (Number(code) === 0) {
          const {
            data: {
              languages,
              defaultLanguage,
              defaultCountryCode,
              customerServiceUrl,
              siteName,
              siteLogo,
              androidDownloadUrl,
              iosDownloadUrl,
              h5Url,
              loginPage,
              registerPage
            }
          } = res;
          if (languages.length > 0) {
            // 保存语言列表
            const LocalesList: any = [];
            languages.map((item: any) => {
              // 获取当前语言配置
              const Locale: any = localeList.filter(
                (locale: any) => item.langKey === locale.value
              )[0];
              if (Locale !== undefined) {
                // 修改语言名称
                Locale.label = item.langName;
                Locale.sort = item.sort;
                // 语言配置文件地址
                Locale.path = item.langPackageUrl;
                // 版本号
                let Version = 1;
                // 获取缓存的服务端语言包版本
                const ServiceVersion = this.ServiceLocaleVersion.filter(
                  (lang: any) => lang.key === Locale.value
                );
                // 如果有获取到对应的版本
                if (ServiceVersion.length > 0) {
                  Version = ServiceVersion[0].version ?? 1;
                }
                // 语言包版本号
                Locale.version = Version ?? 1;
                // 如果是默认语言
                if (Locale.value === defaultLanguage) {
                  Locale.checked = true;
                } else {
                  Locale.checked = false;
                }
                LocalesList.push(Locale);
              }
            });
            // const LanguageList = LocalesList.sort(
            //   (a: any, b: any) => Number(a.sort) - Number(b.sort)
            // );
            // 保存语言列表
            this.setLocaleList(LocalesList);
          }
          // 保存站点配置
          this.setProjectConfig({
            Logo: siteLogo,
            DefaultLanguage: defaultLanguage ?? 'en_US',
            DefaultCountryCode: defaultCountryCode ?? '+1',
            CustomerService: customerServiceUrl ?? '',
            SiteName: siteName ?? '',
            AndroidDownloadUrl: androidDownloadUrl ?? '',
            IosDownloadUrl: iosDownloadUrl ?? '',
            WebPath: h5Url ?? '',
            LoginLogo: loginPage?.imageUrl ?? '',
            RegisterLogo: registerPage?.imageUrl ?? ''
          });
          // 写入站点名称
          setWebSiteContent(siteName);
        }
      });
    },
    // 加载服务器多语言
    async getLoadLocale(locale: LocaleType, _path: string, _version?: string): Promise<void> {
      const { changeLocale } = useLocale();
      // 获取初始化服务器语言配置包
      await changeLocale(locale);
    },
    // 保存加载成功的语言包
    setLoadErrorLocales(payload: any[]): void {
      this.LoadErrorLocales = payload;
    },
    // —— 服务端语言包缓存（持久化在Pinia） ——
    setServerLocaleCache(locale: string, data: any): void {
      this.ServerLocaleCache = this.ServerLocaleCache || {};
      this.ServerLocaleCache[locale] = data;
    },
    getServerLocaleByKey(locale: string): any {
      return this.ServerLocaleCache ? this.ServerLocaleCache[locale] : null;
    },
    clearServerLocaleCache(locale?: string): void {
      if (!this.ServerLocaleCache) return;
      if (locale) {
        delete this.ServerLocaleCache[locale];
      } else {
        this.ServerLocaleCache = {};
      }
    },
    // —— 语言包版本号管理 ——
    setLocaleVersionCache(locale: string, version: string): void {
      this.LocaleVersionCache = this.LocaleVersionCache || {};
      this.LocaleVersionCache[locale] = version;
    },
    getLocaleVersionByKey(locale: string): string | null {
      return this.LocaleVersionCache ? (this.LocaleVersionCache[locale] ?? null) : null;
    },
    clearLocaleVersionCache(locale?: string): void {
      if (!this.LocaleVersionCache) return;
      if (locale) {
        delete this.LocaleVersionCache[locale];
      } else {
        this.LocaleVersionCache = {};
      }
    },
    // 检查并清除过期缓存
    checkAndClearExpiredCache(serverLocaleList: any[]): void {
      if (!serverLocaleList || !Array.isArray(serverLocaleList)) return;
      serverLocaleList.forEach((serverLocale: any) => {
        const locale = serverLocale.value || serverLocale.langKey;
        const serverVersion = serverLocale.version || serverLocale.mtime;
        const localePath = serverLocale.path || serverLocale.nowFileAddress;
        if (locale && serverVersion) {
          const cachedVersion = this.getLocaleVersionByKey(locale);
          // 如果缓存的版本号低于服务端版本号，清除该语言的缓存
          if (cachedVersion && cachedVersion < serverVersion) {
            this.clearServerLocaleCache(locale);
            this.clearLocaleVersionCache(locale);
            // 同时从加载成功列表中移除
            const loadErrorList = this.LoadErrorLocales || [];
            this.setLoadErrorLocales(
              loadErrorList.filter((l: string) => l !== locale && l !== `server_${locale}`)
            );
            // 如果当前使用的语言就是需要更新的语言，则重新加载并初始化语言包
            if (locale === this.localInfo?.locale && localePath) {
              this.getLoadLocale(locale, localePath, serverVersion);
            }
          }
        }
      });
    },
    // 清除指定语言的缓存并且重新加载服务端语言
    clearAndReloadLocaleCache(locale: string): void {
      this.clearServerLocaleCache(locale);
      this.clearLocaleVersionCache(locale);
      // 如果要清楚的语言是当前使用的语言则重新从服务端获取最新语言配置
      const localePath = this.LocaleList.filter((item: any) => item.value === locale)[0].path;
      this.getLoadLocale(locale as LocaleType, localePath);
    },
    // 保存服务端语言列表版本
    setServiceLocaleVersion(payload: any[]): void {
      this.ServiceLocaleVersion = payload;
    },
    // 保存国家区号列表
    async setCountryList() {
      getCountryList().then((res) => {
        const { code, data } = res;
        if (code === 0) {
          this.CountryList = data.map((item: any) => ({
            code: item.code,
            name: item.name,
            nameEn: item.enName,
            areaCode: item.dialingCode
          }));
        }
      });
      // 获取默认的国家区号信息
      const defaultCountry = this.CountryList.filter(
        (item: any) => item.areaCode === this.projectConfig.DefaultCountryCode
      )[0];
      // 保存默认的国家区号信息
      this.DefaultCountryInfo = defaultCountry;
    },
    // 保存法币汇率
    async setFiatExchangeRate() {
      getFiatExchangeRate({ baseSymbol: 'USDT' }).then((res: any) => {
        const { code, data } = res;
        if (code === 0) {
          const map: Record<string, number> = {};
          (data || []).forEach((item: any) => {
            const key = item?.quoteCurrency;
            const rate = Number(item?.rate ?? NaN);
            if (key && !Number.isNaN(rate)) {
              map[key] = rate;
            }
          });
          this.FiatExchangeRate = map;
        }
      });
    },
    // 保存网络类型列表
    setNetworkTypeList(payload: any[]): void {
      this.NetworkTypeList = payload;
    },
    // 保存网络币种列表
    setNetworkCoinList(payload: any[]): void {
      this.NetworkCoinList = payload;
    }
  },
  persist: {
    key: StoreKeyName,
    storage: localStorage
  }
});

/** useSystemStoreWithOut */
export const useSystemStoreWithOut = () => {
  return useSystemStore(store);
};
