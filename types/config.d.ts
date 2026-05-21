import { ThemeEnum } from '/@/enums/appEnum';

// 多语言类型
export type LocaleType =
  | 'en_US'
  | 'zh_TW'
  | 'ja_JP'
  | 'ko_KR'
  | 'ar_AE'
  | 'ru_RU'
  | 'fr_FR'
  | 'es_ES'
  | 'pt_BR'
  | 'tr_TR'
  | 'mn_MN'
  | 'vi_VN'
  | 'th_TH'
  | 'kn_IN'
  | 'nl_NL'
  | 'id_ID'
  | 'it_IT'
  | 'pl_PL'
  | 'uk_UA'
  | 'lt_LT'
  | 'hi_IN'
  | 'bn_BD'
  | 'bg_BG'
  | 'el_GR'
  | 'fa_IR'
  | 'hr_HR'
  | 'hu_HU'
  | 'kk_KZ'
  | 'sk_SK'
  | 'sr_RS'
  | 'sw_KE'
  | 'ur_PK'
  | 'zh_CN'
  | 'ro_RO'
  | 'zh_HK'
  | 'de_DE'
  | 'he_IL'
  | 'am_ET'
  | 'hy_AM'
  | 'uz_UZ';

// 多语言配置
export interface LocaleSetting {
  icon?: string | undefined;
  showPicker: boolean;
  // 当前语言
  locale: LocaleType;
  // 默认语言
  fallback: LocaleType;
  // 可用的语言环境
  availableLocales: LocaleType[];
  // 语言名称
  label?: string | undefined;
  // 语言配置文件地址
  path?: string;
}

// 登录保存账户密码
export interface LoginAccount {
  // 用户名
  username: string | null;
  // 密码
  password: string | null;
  // 是否记住密码
  rememberMe: boolean;
}

// 项目配置
export interface ProjectConfig {
  // 是否开启站点
  isOpenWebSite: boolean;
  // 是否开启站点维护状态
  SystemMaintain: boolean;
  // 网站灰色模式，用于可能悼念的日期开启
  grayMode: boolean;
  // 色弱模式
  colorWeak: boolean;
  // 项目主题色
  themeColor: object;
  // 主题模式
  themeDark: ThemeEnum;
  // 是否显示底部信息 copyright
  showFooter: boolean;
  // 是否开启KeepAlive缓存
  KeepAlive: boolean;
  // 切换界面的时候是否删除未关闭的message及notify
  closeMessageOnSwitch: boolean;
  // 切换界面的时候是否取消已经发送但是未响应的http请求。
  // 如果开启,想对单独接口覆盖。可以在单独接口设置
  removeAllHttpPending: boolean;
  // 登录保存密码
  loginSaveAccount: LoginAccount;
  // H5更新检测定时器执行秒数
  CheckUpgradeSecond: number;
  // 站点Logo
  Logo: string;
  // 默认语言
  DefaultLanguage: string;
  // 默认国家区号
  DefaultCountryCode: string;
  // 客服链接
  CustomerService: string;
  // 站点名称
  SiteName: string;
  // Android下载链接
  AndroidDownloadUrl: string;
  // iOS下载链接
  IosDownloadUrl: string;
  // H5地址
  WebPath: string;
  // 登录页Logo
  LoginLogo: string;
  // 注册页Logo
  RegisterLogo: string;
}

// 公共配置
export interface GlobConfig {
  // 网站标题
  title: string;
  // 服务接口地址
  apiUrl: string;
  // 上传网址
  uploadUrl?: string;
  // 服务接口url前缀
  urlPrefix?: string;
  // 项目简称
  shortName: string;
  // 代理配置
  proxy?: Array;
  // 时间
  timeout: number;
}

// 公共环境变量配置
export interface GlobEnvConfig {
  // 网站标题
  VITE_GLOB_APP_TITLE: string;
  // Service interface url
  VITE_GLOB_API_URL: string;
  // 服务接口url前缀
  VITE_GLOB_API_URL_PREFIX?: string;
  // 项目简称
  VITE_GLOB_APP_SHORT_NAME: string;
  // 上传网址
  VITE_GLOB_UPLOAD_URL?: string;
  // 是否开启数据加密
  VITE_GLOB_ENCRYPT: boolean;
  // 加密密钥
  VITE_GLOB_PUBLICKEY: string;
  // 生产环境API地址
  VITE_API_PATH: string;
  // 公共地址
  VITE_PUBLIC_PATH: string;
  // 版本号
  VITE_GLOB_SYSTEM_VERSION: string;
  // 代理配置
  VITE_GLOB_PROXY: Array;
}
