import { onMounted, onBeforeUnmount } from 'vue';
// 全局状态，确保只初始化一次

/** isInitialized */
let isInitialized = false;

/** touchStartY */
let touchStartY = 0;

/** touchStartX */
let touchStartX = 0;

/** lastTouchY */
let lastTouchY = 0;

/** lastTouchX */
let lastTouchX = 0;

/** scrollTopAtStart */
let scrollTopAtStart = 0;

/** scrollHeightAtStart */
let scrollHeightAtStart = 0;

/** clientHeightAtStart */
let clientHeightAtStart = 0;

/**
 * 检测是否为 iOS 设备
 */
const isIOS = (): boolean => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * 处理 touchstart 事件
 */
const handleTouchStart = (e: TouchEvent): void => {
  // 只处理单指触摸
  if (e.touches.length === 1) {
    const t = e.touches[0];
    if (t) {
      touchStartY = t.clientY;
      touchStartX = t.clientX;
      lastTouchY = touchStartY;
      lastTouchX = touchStartX;
      // 记录触摸开始时的滚动位置
      const target = e.target as HTMLElement;
      const scrollableElement = findScrollableParent(target);
      if (scrollableElement) {
        scrollTopAtStart = scrollableElement.scrollTop;
        scrollHeightAtStart = scrollableElement.scrollHeight;
        clientHeightAtStart = scrollableElement.clientHeight;
      } else {
        const scrollElement = document.documentElement || document.body;
        scrollTopAtStart = scrollElement.scrollTop;
        scrollHeightAtStart = scrollElement.scrollHeight;
        clientHeightAtStart = scrollElement.clientHeight;
      }
    }
  }
};

/**
 * 处理 touchmove 事件
 */
const handleTouchMove = (e: TouchEvent): void => {
  // 只处理单指触摸
  if (e.touches.length !== 1) {
    return;
  }
  // 检查事件是否可取消，如果不可取消则直接返回，避免控制台警告
  if (!e.cancelable) {
    return;
  }
  const t = e.touches[0];
  if (!t) return;
  const touchY = t.clientY;
  const touchX = t.clientX;
  const deltaY = touchY - lastTouchY;
  const deltaX = touchX - lastTouchX;
  lastTouchY = touchY;
  lastTouchX = touchX;
  // 判断是否为垂直滚动
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    const target = e.target as HTMLElement;
    const scrollableElement = findScrollableParent(target);
    let isAtTop = false;
    let isAtBottom = false;
    if (scrollableElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
      // 使用更严格的边界检测，允许1px的误差
      isAtTop = scrollTop <= 1;
      isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    } else {
      // 如果没有找到可滚动元素，检查 document 的滚动状态
      const scrollElement = document.documentElement || document.body;
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      isAtTop = scrollTop <= 1;
      isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    }
    // 如果滚动到顶部且继续向上滑动，或滚动到底部且继续向下滑动，则阻止默认行为
    // 同时检查是否真的在边界（使用 touchstart 时记录的滚动位置作为辅助判断）
    const isReallyAtTop = isAtTop && scrollTopAtStart <= 1;
    const isReallyAtBottom =
      isAtBottom && scrollTopAtStart + clientHeightAtStart >= scrollHeightAtStart - 1;
    if ((isReallyAtTop && deltaY > 0) || (isReallyAtBottom && deltaY < 0)) {
      // 再次确认事件可取消
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }
};

/**
 * 查找可滚动的父元素
 */
const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
  if (!element || element === document.body || element === document.documentElement) {
    return null;
  }
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflow = style.overflow;
  const hasScrollableContent = element.scrollHeight > element.clientHeight;
  // 检查是否为可滚动元素
  if (
    (overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflow === 'auto' ||
      overflow === 'scroll') &&
    hasScrollableContent
  ) {
    return element;
  }
  // 递归查找父元素
  return findScrollableParent(element.parentElement);
};

/**
 * 应用 CSS 样式来禁用回弹效果
 */
const applyCSS = (): void => {
  // 为 body 和 html 添加样式
  const style = document.createElement('style');
  style.id = 'disable-ios-bounce-style';
  style.textContent = `
    html, body {
      overscroll-behavior: none !important;
      overscroll-behavior-y: none !important;
      overscroll-behavior-x: none !important;
      -webkit-overflow-scrolling: touch;
    }
  `;
  // 如果样式已存在，先移除
  const existingStyle = document.getElementById('disable-ios-bounce-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);
};

/**
 * 移除 CSS 样式
 */
const removeCSS = (): void => {
  const style = document.getElementById('disable-ios-bounce-style');
  if (style) {
    style.remove();
  }
};

/**
 * 启用禁用回弹效果
 */
const enable = (): void => {
  if (!isIOS() || isInitialized) {
    return;
  }
  isInitialized = true;
  applyCSS();
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
};

/**
 * 禁用功能（恢复默认行为）
 */
const disable = (): void => {
  if (!isInitialized) {
    return;
  }
  isInitialized = false;
  removeCSS();
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchmove', handleTouchMove);
};

/** useDisableIOSBounce */
export const useDisableIOSBounce = () => {
  let touchStartY = 0;
  let touchStartX = 0;
  let lastTouchY = 0;
  let lastTouchX = 0;
  let scrollTopAtStart = 0;
  let scrollHeightAtStart = 0;
  let clientHeightAtStart = 0;
  /**
   * 检测是否为 iOS 设备
   */
  const isIOSLocal = (): boolean => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  };
  /**
   * 处理 touchstart 事件
   */
  const handleTouchStartLocal = (e: TouchEvent): void => {
    // 只处理单指触摸
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (t) {
        touchStartY = t.clientY;
        touchStartX = t.clientX;
        lastTouchY = touchStartY;
        lastTouchX = touchStartX;
        // 记录触摸开始时的滚动位置
        const target = e.target as HTMLElement;
        const scrollableElement = findScrollableParent(target);
        if (scrollableElement) {
          scrollTopAtStart = scrollableElement.scrollTop;
          scrollHeightAtStart = scrollableElement.scrollHeight;
          clientHeightAtStart = scrollableElement.clientHeight;
        } else {
          const scrollElement = document.documentElement || document.body;
          scrollTopAtStart = scrollElement.scrollTop;
          scrollHeightAtStart = scrollElement.scrollHeight;
          clientHeightAtStart = scrollElement.clientHeight;
        }
      }
    }
  };
  /**
   * 处理 touchmove 事件
   */
  const handleTouchMoveLocal = (e: TouchEvent): void => {
    // 只处理单指触摸
    if (e.touches.length !== 1) {
      return;
    }
    // 检查事件是否可取消，如果不可取消则直接返回，避免控制台警告
    if (!e.cancelable) {
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    const touchY = t.clientY;
    const touchX = t.clientX;
    const deltaY = touchY - lastTouchY;
    const deltaX = touchX - lastTouchX;
    lastTouchY = touchY;
    lastTouchX = touchX;
    // 判断是否为垂直滚动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      const target = e.target as HTMLElement;
      const scrollableElement = findScrollableParent(target);
      let isAtTop = false;
      let isAtBottom = false;
      if (scrollableElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
        // 使用更严格的边界检测，允许1px的误差
        isAtTop = scrollTop <= 1;
        isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      } else {
        // 如果没有找到可滚动元素，检查 document 的滚动状态
        const scrollElement = document.documentElement || document.body;
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        isAtTop = scrollTop <= 1;
        isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      }
      // 如果滚动到顶部且继续向上滑动，或滚动到底部且继续向下滑动，则阻止默认行为
      // 同时检查是否真的在边界（使用 touchstart 时记录的滚动位置作为辅助判断）
      const isReallyAtTop = isAtTop && scrollTopAtStart <= 1;
      const isReallyAtBottom =
        isAtBottom && scrollTopAtStart + clientHeightAtStart >= scrollHeightAtStart - 1;
      if ((isReallyAtTop && deltaY > 0) || (isReallyAtBottom && deltaY < 0)) {
        // 再次确认事件可取消
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
  };
  /**
   * 查找可滚动的父元素
   */
  const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
    if (!element || element === document.body || element === document.documentElement) {
      return null;
    }
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    const hasScrollableContent = element.scrollHeight > element.clientHeight;
    // 检查是否为可滚动元素
    if (
      (overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflow === 'auto' ||
        overflow === 'scroll') &&
      hasScrollableContent
    ) {
      return element;
    }
    // 递归查找父元素
    return findScrollableParent(element.parentElement);
  };
  /**
   * 应用 CSS 样式来禁用回弹效果
   */
  const applyCSS = (): void => {
    // 为 body 和 html 添加样式
    const style = document.createElement('style');
    style.id = 'disable-ios-bounce-style';
    style.textContent = `
      html, body {
        overscroll-behavior: none !important;
        overscroll-behavior-y: none !important;
        overscroll-behavior-x: none !important;
        -webkit-overflow-scrolling: touch;
      }
    `;
    // 如果样式已存在，先移除
    const existingStyle = document.getElementById('disable-ios-bounce-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.head.appendChild(style);
  };
  /**
   * 移除 CSS 样式
   */
  const removeCSS = (): void => {
    const style = document.getElementById('disable-ios-bounce-style');
    if (style) {
      style.remove();
    }
  };
  /**
   * 启用禁用回弹效果
   */
  const enableLocal = (): void => {
    if (!isIOSLocal()) {
      return;
    }
    applyCSS();
    document.addEventListener('touchstart', handleTouchStartLocal, { passive: true });
    document.addEventListener('touchmove', handleTouchMoveLocal, { passive: false });
  };
  /**
   * 禁用功能（恢复默认行为）
   */
  const disableLocal = (): void => {
    removeCSS();
    document.removeEventListener('touchstart', handleTouchStartLocal);
    document.removeEventListener('touchmove', handleTouchMoveLocal);
  };
  // 组件挂载时自动启用
  onMounted(() => {
    enableLocal();
  });
  // 组件卸载时自动禁用
  onBeforeUnmount(() => {
    disableLocal();
  });
  return {
    enable: enableLocal,
    disable: disableLocal,
    isIOS: isIOSLocal()
  };
};

/** initDisableIOSBounce */
export const initDisableIOSBounce = (): void => {
  enable();
};

/** closeDisableIOSBounce */
export const closeDisableIOSBounce = (): void => {
  disable();
};
