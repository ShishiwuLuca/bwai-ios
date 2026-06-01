import { isIOSNativeWebView } from '/@/utils/iosWebViewRepaint';

/** iOS WKWebView 上关闭 Tabs 滑动/切换动画，避免 transform 合成层卡死 */
export const iosNativeTabsAnimated = (): boolean => !isIOSNativeWebView();

/** iOS 上关闭 Tabs 手势横滑（同样依赖 track transform） */
export const iosNativeTabsSwipeable = (): boolean => !isIOSNativeWebView();
