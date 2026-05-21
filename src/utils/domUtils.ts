import type { FunctionArgs } from '@vueuse/core';
import { upperFirst } from 'lodash-es';

/** ViewportOffsetResult：接口数据结构定义 */
export interface ViewportOffsetResult {
  left: number;
  top: number;
  right: number;
  bottom: number;
  rightIncludeBody: number;
  bottomIncludeBody: number;
}

/** getBoundingClientRect */
export const getBoundingClientRect = (element: Element): DOMRect | number => {
  if (!element || !element.getBoundingClientRect) {
    return 0;
  }
  return element.getBoundingClientRect();
};

/** trim */
const trim = (string: string) => {
  return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
};

/** hasClass */
export const hasClass = (el: Element, cls: string) => {
  if (!el || !cls) return false;
  if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  if (el.classList) {
    return el.classList.contains(cls);
  } else {
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
};

/** addClass */
export const addClass = (el: Element, cls: string) => {
  if (!el) return;
  let curClass = el.className;
  const classes = (cls || '').split(' ');
  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) continue;
    if (el.classList) {
      el.classList.add(clsName);
    } else if (!hasClass(el, clsName)) {
      curClass += ' ' + clsName;
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
};

/** removeClass */
export const removeClass = (el: Element, cls: string) => {
  if (!el || !cls) return;
  const classes = cls.split(' ');
  let curClass = ' ' + el.className + ' ';
  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) continue;
    if (el.classList) {
      el.classList.remove(clsName);
    } else if (hasClass(el, clsName)) {
      curClass = curClass.replace(' ' + clsName + ' ', ' ');
    }
  }
  if (!el.classList) {
    el.className = trim(curClass);
  }
};

/** getViewportOffset */
export const getViewportOffset = (element: Element): ViewportOffsetResult => {
  const doc = document.documentElement;
  const docScrollLeft = doc.scrollLeft;
  const docScrollTop = doc.scrollTop;
  const docClientLeft = doc.clientLeft;
  const docClientTop = doc.clientTop;
  const pageXOffset = window.pageXOffset;
  const pageYOffset = window.pageYOffset;
  const box = getBoundingClientRect(element);
  const { left: retLeft, top: rectTop, width: rectWidth, height: rectHeight } = box as DOMRect;
  const scrollLeft = (pageXOffset || docScrollLeft) - (docClientLeft || 0);
  const scrollTop = (pageYOffset || docScrollTop) - (docClientTop || 0);
  const offsetLeft = retLeft + pageXOffset;
  const offsetTop = rectTop + pageYOffset;
  const left = offsetLeft - scrollLeft;
  const top = offsetTop - scrollTop;
  const clientWidth = window.document.documentElement.clientWidth;
  const clientHeight = window.document.documentElement.clientHeight;
  return {
    left: left,
    top: top,
    right: clientWidth - rectWidth - left,
    bottom: clientHeight - rectHeight - top,
    rightIncludeBody: clientWidth - left,
    bottomIncludeBody: clientHeight - top
  };
};

/** hackCss */
export const hackCss = (attr: string, value: string) => {
  const prefix: string[] = ['webkit', 'Moz', 'ms', 'OT'];
  const styleObj: any = {};
  prefix.forEach((item) => {
    styleObj[`${item}${upperFirst(attr)}`] = value;
  });
  return {
    ...styleObj,
    [attr]: value
  };
};

/** on */
export const on = (
  element: Element | HTMLElement | Document | Window,
  event: string,
  handler: EventListenerOrEventListenerObject
): void => {
  if (element && event && handler) {
    element.addEventListener(event, handler, false);
  }
};

/** off */
export const off = (
  element: Element | HTMLElement | Document | Window,
  event: string,
  handler: Fn
): void => {
  if (element && event && handler) {
    element.removeEventListener(event, handler, false);
  }
};

/** once */
export const once = (el: HTMLElement, event: string, fn: EventListener): void => {
  const listener = function (this: any, evt: Event) {
    if (fn) {
      fn.call(this, evt);
    }
    off(el, event, listener);
  };
  on(el, event, listener);
};

/** 用户：useRafThrottle */
export const useRafThrottle = <T extends FunctionArgs>(fn: T): T => {
  let locked = false;
  // @ts-ignore
  return function (...args: any[]) {
    if (locked) return;
    locked = true;
    window.requestAnimationFrame(() => {
      // @ts-ignore
      fn.apply(this, args);
      locked = false;
    });
  };
};
