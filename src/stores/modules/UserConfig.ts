import { store } from '/@/stores';
import { defineStore } from 'pinia';
import { getAppEnvConfig } from '/@/utils/env';
import { isNative } from '/@/hooks/useAppInfo';
import { setCssVar } from '/@/logics/theme/util';
import { getUserInfo, logout } from '/@/service/Auth';
import { useSystemStoreWithOut } from './SystemConfig';
import { getWithdrawalNetworkType } from '/@/service/System';

/** 解构赋值：组合式 API 返回的一组方法或状态 */
const { VITE_GLOB_APP_TITLE } = getAppEnvConfig();

// 配置名称Key

/** StoreKeyName：APP 端使用固定前缀 `App`，与 System 一致 */
const StoreKeyName = (isNative ? 'App' : location.host) + '_' + VITE_GLOB_APP_TITLE + '_User';

// 用户信息

/** UserState：接口数据结构定义（用户） */
interface UserState {
  // 令牌
  Token: string | null;
  // 个人信息
  UserInfo: object;
  // 设备UID
  DeviceUUID: string | null;
  // 涨跌模式 1绿涨红跌 2红涨绿跌
  TopDownMode: number;
  // 涨跌颜色配置
  TopDownColor: any;
  // 记住密码
  SaveAccount: any;
  // 是否倒置组件插槽位置
  isRTL: boolean;
  // 公告内容
  NoticeContent: string | null;
  // 底部TabBar当前选中项
  ActiveTab: number;
  // 需要编辑的地址信息
  EditAddress: any;
  // 资产币种
  AssetCurrencyList: any[];
}

// 导出用户信息

/** 用户：useUserStore */
export const useUserStore = defineStore(StoreKeyName, {
  state: (): UserState => ({
    // 令牌
    Token: null,
    // 个人信息
    UserInfo: {},
    // 设备UID
    DeviceUUID: null,
    // 涨跌模式 1绿涨红跌 2红涨绿跌
    TopDownMode: 1,
    // 涨跌颜色配置
    TopDownColor: {},
    // 记住密码
    SaveAccount: {},
    // 是否倒置组件插槽位置
    isRTL: false,
    // 公告内容
    NoticeContent: '',
    // 底部TabBar当前选中项
    ActiveTab: 0,
    // 需要编辑的地址信息
    EditAddress: {},
    // 资产币种
    AssetCurrencyList: []
  }),
  // getters
  getters: {
    // 获取Token
    getToken(): string | null {
      return this.Token || null;
    },
    // 获取个人信息
    getUserInfo(): object {
      return this.UserInfo || {};
    },
    // 获取设备UID
    getDeviceUUID(): string | null {
      return this.DeviceUUID;
    },
    // 获取涨跌模式
    getTopDownMode(): number {
      return this.TopDownMode;
    },
    // 获取涨跌颜色配置
    getTopDownColor(): object {
      return this.TopDownColor;
    },
    // 获取记住密码
    getSaveAccount(): object {
      return this.SaveAccount;
    },
    // 是否倒置组件插槽位置
    getIsRTL(): boolean {
      return this.isRTL;
    },
    // 用户配置（ContractUtils 等使用，如 coUnit）
    UserConfig(): Record<string, unknown> {
      return { ...this.SaveAccount, ...this.UserInfo } as Record<string, unknown>;
    },
    // 获取公告内容
    getNoticeContent(): string | null {
      return this.NoticeContent;
    },
    // 获取底部TabBar当前选中项
    getActiveTab(): number {
      return this.ActiveTab;
    },
    // 获取需要编辑的地址信息
    getEditAddress(): any {
      return this.EditAddress;
    },
    // 获取资产币种
    getAssetCurrencyList(): any[] {
      return this.AssetCurrencyList;
    }
  },
  // actions
  actions: {
    // 写入用户信息
    setUserInfo(payload: object): void {
      this.UserInfo = { ...this.UserInfo, ...payload };
    },
    // 刷新用户余额（占位，具体逻辑由业务实现）
    setUserBalance(): void {
      // noop
    },
    // 写入用户配置（占位，具体逻辑由业务实现）
    setUserConfig(): void {
      // noop
    },
    // 写入令牌
    setToken(payload: string | null): void {
      this.Token = payload;
    },
    /**
     * 保存设备 UID（与 HTTP 头 device、WS 等对齐）
     * @param force 为 true 时用新值覆盖（例如从原生 Device.getId 纠正临时随机 UUID）
     */
    setDeviceUUID(payload: string, force = false): void {
      const v = payload?.trim();
      if (!v) return;
      if (force || !this.DeviceUUID) {
        this.DeviceUUID = v;
      }
    },
    // 清除登录状态
    LoginOut(): void {
      this.Token = null;
      this.UserInfo = {};
      void import('/@/utils/appNativeNotify').then((m) => m.resetNativeUpdateReminderOnLogout());
      void import('/@/utils/appIconBadge').then((m) => {
        void m.clearAppIconBadge().catch(() => {});
      });
    },
    // 修改涨跌模式
    setTopDownMode(payload: number): void {
      this.TopDownMode = payload;
      if (this.TopDownColor.up && this.TopDownColor.down) {
        // 如果是绿涨红跌
        if (Number(payload) === 1) {
          // 涨
          setCssVar('--van-top-color', this.TopDownColor.up);
          // 跌
          setCssVar('--van-down-color', this.TopDownColor.down);
        } else {
          // 涨
          setCssVar('--van-top-color', this.TopDownColor.down);
          // 跌
          setCssVar('--van-down-color', this.TopDownColor.up);
        }
      }
    },
    // 保存涨跌颜色配置
    setTopDownColor(payload: object): void {
      this.TopDownColor = payload;
    },
    // 保存账号密码
    setSaveAccount(payload: object): void {
      this.SaveAccount = payload;
    },
    // 是否倒置组件插槽位置
    setIsRTL(payload: boolean): void {
      this.isRTL = payload;
    },
    // 获取用户信息
    fetchUserInfo(): void {
      getUserInfo().then((res) => {
        const { code, data } = res;
        if (code === 0) {
          this.setUserInfo(data);
        }
      });
    },
    // 退出登录
    LoginOutUser(): void {
      logout().then((res) => {
        const { code } = res;
        if (code === 0) {
          this.LoginOut();
        }
      });
    },
    // 设置公告内容
    setNoticeContent(payload: string | null): void {
      this.NoticeContent = payload;
    },
    // 设置底部TabBar当前选中项
    setActiveTab(payload: number): void {
      this.ActiveTab = payload;
    },
    // 设置需要编辑的地址信息
    setEditAddress(payload: any): void {
      this.EditAddress = payload;
    },
    // 设置资产币种
    setAssetCurrencyList(payload: any): void {
      this.AssetCurrencyList = payload;
    },
    // 获取资产币种
    fetchAssetCurrencyList(): void {
      const SystemStore = useSystemStoreWithOut();
      getWithdrawalNetworkType({}).then((res) => {
        const { code } = res;
        if (code === 0) {
          const {
            data: { assetCoins, networkCoins, networkTypes }
          } = res;
          // 保存资产币种列表
          if (assetCoins) {
            this.setAssetCurrencyList(assetCoins);
          }
          // 保存网络类型列表
          if (networkTypes) {
            SystemStore.setNetworkTypeList(networkTypes);
          }
          // 保存网络币种列表
          if (networkCoins) {
            SystemStore.setNetworkCoinList(networkCoins);
          }
        }
      });
    }
  },
  persist: {
    key: StoreKeyName,
    storage: localStorage
  }
});

/** 用户：useUserStoreWithOut */
export const useUserStoreWithOut = () => {
  return useUserStore(store);
};
