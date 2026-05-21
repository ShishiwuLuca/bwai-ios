import { ThemeEnum } from '/@/enums/appEnum';
import type { ProjectConfig } from '/#/config';

/** ColorType：接口数据结构定义 */
export interface ColorType {
  label: string;
  value: string;
  reverseColor?: string;
  bgColor?: string;
}

// 主题颜色配置

/** 常量或静态配置：列表数据 */
export const APP_PRESET_COLOR_LIST: ColorType[] = [{ label: '', value: '#0050B3' }];

// 皮肤

/** 常量或静态配置：列表数据 */
export const APP_THEME_LIST: any[] = [
  { label: 'light', value: 'light', default: false },
  { label: 'dark', value: 'dark', default: true }
];

// 改动后需要清空浏览器缓存

/** 常量或静态配置：setting */
const setting: ProjectConfig = {
  // 是否开启站点
  isOpenWebSite: true,
  // 是否开启站点维护状态
  SystemMaintain: false,
  // 网站灰色模式，用于可能悼念的日期开启
  grayMode: false,
  // 色弱模式
  colorWeak: false,
  // 项目主题色
  themeColor: (APP_PRESET_COLOR_LIST[0] ?? {}) as object,
  // 主题模式
  themeDark: ThemeEnum.DARK,
  // 是否显示底部信息 copyright
  showFooter: true,
  // 是否开启KeepAlive缓存
  KeepAlive: true,
  // 切换界面的时候是否删除未关闭的message及notify
  closeMessageOnSwitch: true,
  // 切换界面的时候是否取消已经发送但是未响应的http请求。
  // 如果开启,想对单独接口覆盖。可以在单独接口设置
  removeAllHttpPending: true,
  // 登录保存密码
  loginSaveAccount: {
    // 用户名
    username: null,
    // 密码
    password: null,
    // 是否记住密码
    rememberMe: false
  },
  // H5更新检测定时器执行秒数
  CheckUpgradeSecond: 300,
  // 站点Logo
  Logo: '',
  // 默认语言
  DefaultLanguage: 'en_US',
  // 默认国家区号
  DefaultCountryCode: '+1',
  // 客服链接
  CustomerService: '',
  // 站点名称
  SiteName: '',
  // Android下载链接
  AndroidDownloadUrl: '',
  // iOS下载链接
  IosDownloadUrl: '',
  // H5 地址
  WebPath: '',
  // 登录页 Logo
  LoginLogo: '',
  // 注册页 Logo
  RegisterLogo: ''
};

export default setting;
