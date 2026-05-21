/** docEle */
const docEle = document.documentElement;

/** 切换展开/折叠等：toggleClass */
export const toggleClass = (flag: boolean, clsName: string, target?: HTMLElement) => {
  const targetEl = target || document.body;
  let { className } = targetEl;
  className = className.replace(clsName, '');
  targetEl.className = flag ? `${className} ${clsName} ` : className;
};

/** setCssVar */
export const setCssVar = (prop: string, val: any, dom = docEle) => {
  dom.style.setProperty(prop, val);
};

/** useCssVar */
export const useCssVar = (name: string, el: HTMLElement = document.documentElement) => {
  return getComputedStyle(el).getPropertyValue(name).trim();
};
