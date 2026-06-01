import { withInstall } from '/@/utils';

// 更新检测
import AppCheckUpdates from './CheckUpdate.vue';

// 导航栏
import AppNavBar from './NavBar.vue';

// 页面容器（body 背景）
import PageWrapComp from './PageWrap/PageWrap.vue';

// 渐变卡片
import AppCardLinearComp from './AppCardLinear/AppCardLinear.vue';

// 底部 TabBar
import AppTabBarComp from './AppTabBar/AppTabBar.vue';

// 国家选择弹窗
import CountryPickerComp from './CountryPicker/CountryPicker.vue';

// APP 更新弹窗

// 语言选择弹窗
import LocaleModalComp from './LocaleModal.vue';

/** CheckUpdates */
export const CheckUpdates = withInstall(AppCheckUpdates);

/** NavBar */
export const NavBar = withInstall(AppNavBar);

/** PageWrap */
export const PageWrap = withInstall(PageWrapComp);

/** AppCardLinear */
export const AppCardLinear = withInstall(AppCardLinearComp);

/** Tab 状态：AppTabBar */
export const AppTabBar = withInstall(AppTabBarComp);

/** CountryPicker */
export const CountryPicker = withInstall(CountryPickerComp);

/** LocaleModal */
export const LocaleModal = withInstall(LocaleModalComp);
