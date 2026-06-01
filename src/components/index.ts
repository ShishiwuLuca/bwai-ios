import { withInstall } from '/@/utils';

// 折线图
import AppEcharts from './ECharts.vue';

// 加载
import AppLoading from './Loading.vue';

// 数字滚动
import AppCountTo from './CountTo.vue';

// 更新检测
import AppCheckUpdates from './CheckUpdate.vue';

// 导航栏
import AppNavBar from './NavBar.vue';

// 页面容器（body 背景）
import PageWrapComp from './PageWrap/PageWrap.vue';

// 卡片（主题 card 背景）
import AppCardComp from './AppCard/AppCard.vue';

// 渐变卡片
import AppCardLinearComp from './AppCardLinear/AppCardLinear.vue';

// 底部 TabBar
import AppTabBarComp from './AppTabBar/AppTabBar.vue';

// 国家选择弹窗
import CountryPickerComp from './CountryPicker/CountryPicker.vue';

// APP 更新弹窗
import AppUpdateDialogComp from './AppUpdateDialog/AppUpdateDialog.vue';

// 语言选择弹窗
import LocaleModalComp from './LocaleModal.vue';

// 邀请弹窗
import InviteModalComp from './InviteModal/InviteModal.vue';

/** ECharts */
export const ECharts = withInstall(AppEcharts);

/** 加载中状态：Loading */
export const Loading = withInstall(AppLoading);

/** CountTo */
export const CountTo = withInstall(AppCountTo);

/** CheckUpdates */
export const CheckUpdates = withInstall(AppCheckUpdates);

/** NavBar */
export const NavBar = withInstall(AppNavBar);

/** PageWrap */
export const PageWrap = withInstall(PageWrapComp);

/** AppCard */
export const AppCard = withInstall(AppCardComp);

/** AppCardLinear */
export const AppCardLinear = withInstall(AppCardLinearComp);

/** Tab 状态：AppTabBar */
export const AppTabBar = withInstall(AppTabBarComp);

/** CountryPicker */
export const CountryPicker = withInstall(CountryPickerComp);

/** AppUpdateDialog */
export const AppUpdateDialog = withInstall(AppUpdateDialogComp);

/** LocaleModal */
export const LocaleModal = withInstall(LocaleModalComp);

/** InviteModal */
export const InviteModal = withInstall(InviteModalComp);
