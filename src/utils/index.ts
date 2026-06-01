import pako from 'pako';
import { md5 } from 'js-md5';
import Decimal from 'decimal.js';
import { unref, ref } from 'vue';
import type { App, Plugin } from 'vue';
import { isObject } from '/@/utils/is';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';
import { useRouter, type RouteLocationNormalized, type RouteRecordNormalized } from 'vue-router';

/** noop */
export const noop = () => {};

/** getPopupContainer */
export const getPopupContainer = (node?: HTMLElement): HTMLElement => {
  return (node?.parentNode as HTMLElement) ?? document.body;
};

/** setObjToUrlParams */
export const setObjToUrlParams = (baseUrl: string, obj: any): string => {
  let parameters = '';
  for (const key in obj) {
    parameters += key + '=' + encodeURIComponent(obj[key]) + '&';
  }
  parameters = parameters.replace(/&$/, '');
  return baseUrl.endsWith('?') ? baseUrl + parameters : baseUrl.replace(/\/?$/, '?') + parameters;
};

/** 常量或静态配置：deepMerge */
export const deepMerge = <T = any>(src: any = {}, target: any = {}): T => {
  let key: string;
  for (key in target) {
    src[key] = isObject(src[key]) ? deepMerge(src[key], target[key]) : (src[key] = target[key]);
  }
  return src;
};

/** getDynamicProps */
export const getDynamicProps = <T extends object, U>(props: T): Partial<U> => {
  const ret: Recordable = {};
  Object.keys(props).map((key) => {
    ret[key] = unref((props as Recordable)[key]);
  });
  return ret as Partial<U>;
};

/** 当前路由：getRawRoute */
export const getRawRoute = (route: RouteLocationNormalized): RouteLocationNormalized => {
  if (!route) return route;
  const { matched, ...opt } = route;
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path
        }))
      : undefined) as RouteRecordNormalized[]
  };
};

/** withInstall */
export const withInstall = (component: any, alias?: string) => {
  const comp = component as any;
  comp.install = (app: App) => {
    app.component(comp.name || comp.displayName, component);
    if (alias) {
      app.config.globalProperties[alias] = component;
    }
  };
  return component as any & Plugin;
};

/** useCopyToClipboard */
export const useCopyToClipboard = (val: string) => {
  let isSuccessRef = false;
  //创建input标签
  const input = document.createElement('input');
  //将input的值设置为需要复制的内容
  input.value = val;
  //添加input标签
  document.body.appendChild(input);
  //选中input标签
  input.select();
  //执行复制
  document.execCommand('copy');
  if (document.execCommand('copy')) {
    isSuccessRef = true;
  } else {
    isSuccessRef = false;
  }
  //移除input标签
  document.body.removeChild(input);
  return isSuccessRef;
};

/** NewOpenWindow */
export const NewOpenWindow = (path: any) => {
  const router = useRouter();
  // 如果有链接地址
  if (path) {
    // 如果有协议头
    if (path.includes('http') || path.includes('mailto:')) {
      // H5
      const Form = document.createElement('a');
      Form.setAttribute('href', path);
      Form.setAttribute('target', '_blank');
      Form.click();
    } else {
      router.push(path);
    }
  }
};

/** toBack */
export const toBack = () => {
  history.back();
};

// 获取对应的语言标识

/** getLocalesCode */
export const getLocalesCode = () => {
  const SystemStore = useSystemStoreWithOut();
  // 语言标识
  const LocalesCode = ref<string>('en-us');
  // 当前语言标识
  const ThisLocaleCode: any = SystemStore.localInfo.locale;
  // 处理标识
  switch (ThisLocaleCode) {
    // 简体中文
    case 'zh_CN':
      LocalesCode.value = 'zh-cn';
      break;
    // 英语
    case 'en_US':
      LocalesCode.value = 'en-us';
      break;
    // 繁体中文
    case 'zh_TW':
      LocalesCode.value = 'zh-tw';
      break;
    // 繁体中文香港
    case 'zh_HK':
      LocalesCode.value = 'zh-hk';
      break;
    // 日语
    case 'ja_JP':
      LocalesCode.value = 'ja-jp';
      break;
    // 韩语
    case 'ko_KR':
      LocalesCode.value = 'ko-kr';
      break;
    // 阿拉伯语
    case 'ar_AE':
      LocalesCode.value = 'ar-ae';
      break;
    // 法语
    case 'fr_FR':
      LocalesCode.value = 'fr-fr';
      break;
    // 西班牙语
    case 'es_ES':
      LocalesCode.value = 'es-es';
      break;
    // 葡萄牙语
    case 'pt_BR':
      LocalesCode.value = 'pt-br';
      break;
    // 泰语
    case 'th_TH':
      LocalesCode.value = 'th-th';
      break;
    // 德语
    case 'de_DE':
      LocalesCode.value = 'de-de';
      break;
    // 俄语
    case 'ru_RU':
      LocalesCode.value = 'ru-ru';
      break;
    // 越南语
    case 'vi_VN':
      LocalesCode.value = 'vi-vn';
      break;
    // 土耳其语
    case 'tr_TR':
      LocalesCode.value = 'tr-tr';
      break;
    // 印尼语
    case 'id_ID':
      LocalesCode.value = 'id-id';
      break;
    // 印度语
    case 'hi_IN':
      LocalesCode.value = 'hi-in';
      break;
    // 波斯语
    case 'fa_IR':
      LocalesCode.value = 'fa-ir';
      break;
    // 巴基斯坦语
    case 'ur_PK':
      LocalesCode.value = 'ur-pk';
      break;
    // 孟加拉语
    case 'bn_BD':
      LocalesCode.value = 'bn-bd';
      break;
    // 立陶宛语
    case 'lt_LT':
      LocalesCode.value = 'lt-lt';
      break;
    // 罗马尼亚语
    case 'ro_RO':
      LocalesCode.value = 'ro-ro';
      break;
    // 引入荷兰语
    case 'nl_NL':
      LocalesCode.value = 'nl-nl';
      break;
    // 意大利语
    case 'it_IT':
      LocalesCode.value = 'it-it';
      break;
    // 波兰语
    case 'pl_PL':
      LocalesCode.value = 'pl-pl';
      break;
    // 乌克兰语
    case 'uk_UA':
      LocalesCode.value = 'uk-ua';
      break;
    // 保加利亚语
    case 'bg_BG':
      LocalesCode.value = 'bg-bg';
      break;
    // 哈萨克语
    case 'kk_KZ':
      LocalesCode.value = 'kk-kz';
      break;
    // 塞尔维亚语
    case 'sr_RS':
      LocalesCode.value = 'sr-rs';
      break;
    // 克罗地亚语
    case 'hr_HR':
      LocalesCode.value = 'hr-hr';
      break;
    // 匈牙利语
    case 'hu_HU':
      LocalesCode.value = 'hu-hu';
      break;
    // 斯洛伐克语
    case 'sk_SK':
      LocalesCode.value = 'sk-sk';
      break;
    // 斯瓦希里语
    case 'sw_KE':
      LocalesCode.value = 'sw-ke';
      break;
    // 希腊语
    case 'el_GR':
      LocalesCode.value = 'el-gr';
      break;
    // 蒙古语
    case 'mn_MN':
      LocalesCode.value = 'mn-mn';
      break;
    // 希伯来语
    case 'he_IL':
      LocalesCode.value = 'he-il';
      break;
    // 埃塞俄比亚语
    case 'am_ET':
      LocalesCode.value = 'am-et';
      break;
    // 亚美尼亚语
    case 'hy_AM':
      LocalesCode.value = 'hy-am';
      break;
  }
  return LocalesCode.value;
};

/**
 * 将一个数组切割为两个数组
 * @params arr 需要处理的数组
 */
export const splitByAverage = (arr: any[]) => {
  if (arr.length === 0) return [[], []]; // 处理空数组情况
  const mid = Math.floor(arr.length / 2); // 计算数组长度的一半(向下取整)
  const firstHalf = arr.slice(0, mid); // 前半部分
  const secondHalf = arr.slice(mid); // 后半部分
  return [firstHalf, secondHalf];
};

// 币种收款地址正则

/** 常量或静态配置：cryptoRegex */
export const cryptoRegex: Record<string, RegExp> = {
  erc20: /^0x[a-fA-F0-9]{40}$/,
  polygon20: /^0x[a-fA-F0-9]{40}$/,
  trc20: /^T[a-zA-Z0-9]{33}$/,
  bep20: /^0x[a-fA-F0-9]{40}$/
};

/** Capitalize */
export const Capitalize = (word: string) => {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
};

/** CreateSignStr */
export const CreateSignStr = (params: any) => {
  // 秘钥
  const Secret = 'jiaoyisuo@2017';
  const sortedKeys = Object.keys(params).sort();
  let builder = '';
  for (const key of sortedKeys) {
    builder += key + params[key];
  }
  builder += Secret;
  const sign = md5(builder);
  return sign;
};

/** DecryptWs */
export const DecryptWs = (params: any) => {
  const ua = new Uint8Array(params);
  return JSON.parse(pako.inflate(ua, { to: 'string' }));
};

/** 格式化展示：formatVolume */
export const formatVolume = (vol: any) => {
  if (vol === null || vol === undefined) return '-';
  const absVol = Math.abs(vol);
  let formatted = '';
  if (absVol >= 1000000000) {
    formatted = (vol / 1000000000).toFixed(2) + 'B';
  } else if (absVol >= 1000000) {
    formatted = (vol / 1000000).toFixed(2) + 'M';
  } else if (absVol >= 1000) {
    formatted = (vol / 1000).toFixed(2) + 'K';
  } else {
    formatted = vol.toString();
  }
  return formatted;
};

/**
 * @param {*} hex 颜色编码
 * @param {*} alpha 透明度
 * @returns
 */
export const hexToRgba = (hex: string, alpha: number) => {
  // 处理格式 #rrggbb
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    // 处理 #rgb 简写
    hex = hex
      .split('')
      .map((s) => s + s)
      .join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
/**
 * 计算汇率
 * @param price 价格
 * @param exrate 汇率配置
 * @param market 币种
 * @returns
 */
// export const fixRate = (price: string | number, market: string) => {
//   const SystemStore = useSystemStoreWithOut();
//   // 当前语言标识
//   const lang = SystemStore.localInfo.locale;
//   // 汇率
//   const ExRate = SystemStore.SymbolRate;
//   if (!ExRate) {
//     return '--';
//   }
//   const larate = ExRate[lang] || ExRate.en_US;
//   if (!larate) {
//     return '--';
//   }
//   const pric = larate[market] * parseFloat(price);
//   if (`${parseFloat(pric)}` !== 'NaN') {
//     const rate = typeof larate.symbolPrecision !== 'undefined' ? larate.symbolPrecision : larate.coin_precision;
//     return larate.lang_logo + pric.toFixed(rate);
//   }
//   return '--';
// };
/**
 * 精度计算E+处理方法
 * @param num
 * @param precision
 * @param autoFix
 * @returns
 */
const fixDEAdd = (num: any, precision: any, autoFix: boolean = true) => {
  if (`${num}` === '0') {
    if (!window.parseFloat(precision) || !autoFix) return 0;
    return '0.'.padEnd(precision + 2, '0');
  }
  if (!num) return '--';
  const number = parseFloat(num);
  const strN = num.toString();
  const flag = number < 0;
  let result = strN;
  if (strN.toLowerCase().indexOf('e') > -1) {
    const n = strN.match(/(\d+?)(?:\.(\d*))?e([+-])(\d+)/);
    if (n) {
      const nl = n[1] || ''; // 小数点左边
      const nr = n[2] || ''; // 小数点右边
      const type = n[3] || ''; //  + / -
      const floatN = n[4] || ''; // 科学计数法的位数
      let params = '';
      let pr = nr ? nr.substr(floatN) : '';
      if (pr) pr = `.${pr}`;
      if (type !== '-') {
        for (let i = 0; i < floatN; i += 1) {
          const p = nr[i] || '0';
          params += p;
        }
        result = nl + params + pr;
      } else {
        let strl = '0';
        for (let i = 0; i < floatN; i += 1) {
          const p = nl[nl.length - i - 1] || '0';
          params = p + params;
        }
        if (nl.length > floatN) strl = nl.substr(0, nl.length - floatN);
        result = `${strl}.${params}${nr}`;
      }
    }
  }
  if (precision && autoFix) {
    let pal = `${result.split('.')[0]}.`;
    const par = result.split('.')[1] || '';
    for (let i = 0; i < precision; i += 1) {
      pal += par[i] || '0';
    }
    result = pal;
  }
  if (result.length > 14) {
    const arry = result.split('.');
    if (arry[0].length > 14) {
      result = `${arry[0].slice(0, 14)}+`;
    } else {
      result = result.slice(0, 13);
      if (result.indexOf('.') === 12) {
        result = result.slice(0, 12);
      }
    }
  }
  return `${flag ? '-' : ''}${result}`;
};
/**
 * 精度计算
 * @param num
 * @param precision
 * @param autoFix
 * @returns
 */
export const fixD = (num: string | number, precision: any, autoFix = true) => {
  // num初始化
  if (`${num}` === '0') {
    if (!window.parseFloat(precision)) {
      return 0;
    }
    return '0.'.padEnd(precision + 2, '0');
  }
  if (!num) {
    return '--';
  }
  // 暂用 ----
  // if (num.length > 14) {
  //   let rNum = num.slice(0, 14);
  //   if (num[13] === '.') {
  //     rNum = rNum.slice(0, 13);
  //   }
  //   return `${rNum}+`;
  // }
  // ----------
  let flag = false;
  if (parseFloat(num) < 0) {
    flag = true;
  }
  const newnum = `${Math.abs(parseFloat(num))}`;
  if (newnum === 'NaN') {
    return '--';
  }
  let fixNum: any = newnum;
  // 科学计数法计算
  if (newnum.toLowerCase().indexOf('e') > -1) {
    if (newnum.toLowerCase().indexOf('+') > -1) return fixDEAdd(newnum, precision);
    const a = newnum.toLowerCase().split('e');
    const a0 = a[0] ?? '';
    let b = a0;
    const c = Math.abs(parseFloat(a[1] ?? '0'));
    let d = '';
    let h = b.length;
    let i;
    const a0Parts = a0.split('.');
    if (a0Parts[1]) {
      b = (a0Parts[0] ?? '') + a0Parts[1];
      h = (a0Parts[0] ?? '').length;
    }
    for (i = 0; i < c - h; i += 1) {
      d += '0';
    }
    fixNum = `0.${d}${b}`;
  }
  // 精度格式化
  // precision初始化
  if (`${precision}` !== '0' && !precision) {
    return (flag ? '-' : '') + fixNum;
  }
  if (`${parseFloat(num)}` === 'NaN') {
    return (flag ? '-' : '') + fixNum;
  }
  const fNum = fixNum.split('.');
  if (precision === 0) {
    fixNum = parseInt(fixNum, 10);
  } else if (precision > 0 && fNum[1]) {
    if (fNum[1].length > precision) {
      if (fNum[1].indexOf('99999999999') > -1) {
        const s = parseFloat(fixNum).toFixed(precision + 1);
        fixNum = s.slice(0, s.length - 1);
      } else {
        fixNum = `${fNum[0]}.${fNum[1].slice(0, precision)}`;
      }
    } else {
      fixNum = parseFloat(fixNum).toFixed(precision);
    }
  } else {
    fixNum = parseFloat(fixNum).toFixed(precision);
  }
  if (fixNum.length >= 14 && fixNum.indexOf('.') > -1) {
    const arry = fixNum.split('.');
    if (arry[0].length > 14) {
      fixNum = `${arry[0].slice(0, 14)}+`;
    } else if (autoFix) {
      fixNum = fixNum.slice(0, 13);
      if (fixNum.indexOf('.') === 12) {
        fixNum = fixNum.slice(0, 12);
      }
    }
  }
  return (flag ? '-' : '') + fixNum;
};
/**
 * @param {*} symbol 币对信息
 * @param {*} data 深度行情
 * @param {*} depthValue 价格保留小数位
 * @returns
 */
// export const setDepthData = (symbol: any, data: any, depthValue: number) => {
//   let dataTypeKey: any = {};
//   try {
//     dataTypeKey = Object.keys(data);
//   } catch (error) {
//     return false;
//   }
//   const priceFix = depthValue || 2;
//   const volumeFix = symbol.coinResultVo.symbolPricePrecision || 0;
//   const marketName = symbol.quote;
//   const depthListData: any = {};
//   let maxTotal = 0;
//   dataTypeKey.forEach((item) => {
//     if (item !== 'newData') {
//       const objItem = data[item];
//       let totalNum = 0;
//       let maxVal = 0;
//       const dataArr: any = [];
//       let objKeys: any = null;
//       if (item === 'asks') {
//         objKeys = Object.keys(objItem).sort((a: any, b: any) => a - b);
//       } else {
//         objKeys = Object.keys(objItem).sort((a: any, b: any) => b - a);
//       }
//       // 去掉 价格为零的
//       objKeys.forEach((itemKey: any, _index: any) => {
//         const itemArr = objItem[itemKey];
//         if (Number(fixD(itemArr[1], priceFix)) !== 0 && dataArr.length < 150 && itemArr[1]) {
//           // 获取最大的数量
//           maxVal = maxVal < itemArr[1] ? itemArr[1] : maxVal;
//           totalNum += itemArr[1];
//           const ratePrice = fixRate(itemArr[0], marketName);
//           const objd = {
//             rate: ratePrice,
//             total: fixD(totalNum, volumeFix),
//             price: fixD(itemArr[0], volumeFix),
//             vol: fixD(itemArr[1], priceFix),
//             diff: itemArr[1]
//           };
//           // 处理增量数据
//           if (data.newData && data.newData.indexOf(itemArr[0]) < 0) {
//             objd.diff = 0;
//           }
//           dataArr.push(objd);
//         }
//       });
//       depthListData[item] = dataArr;
//       if (maxTotal < maxVal) {
//         maxTotal = maxVal;
//       }
//     }
//   });
//   return {
//     symbol: symbol.base,
//     depthMaxNumber: maxTotal,
//     asks: depthListData.asks
//       .map((item: any) => {
//         const numberSize = (parseFloat(item.vol) / parseFloat(maxTotal)) * 100;
//         item.rateNumber = (
//           Math.floor(numberSize * Math.pow(10, 2)) / Math.pow(10, volumeFix)
//         ).toFixed(2);
//         // 处理转换vol
//         item.vol = Number(item.vol);
//         return item;
//       })
//       .sort((a: any, b: any) => b.price - a.price),
//     buys: depthListData.buys
//       .map((item: any) => {
//         const numberSize = (parseFloat(item.vol) / parseFloat(maxTotal)) * 100;
//         item.rateNumber = (
//           Math.floor(numberSize * Math.pow(10, 2)) / Math.pow(10, volumeFix)
//         ).toFixed(2);
//         // 处理转换vol
//         item.vol = Number(item.vol);
//         return item;
//       })
//       .sort((a: any, b: any) => b.price - a.price)
//   };
// };

/** getOSNameModern */
export const getOSNameModern = (): string => {
  // userAgentData 是较新的 API，可能不兼容所有浏览器
  const platform = navigator.userAgent;
  if (/Win|Windows|Windows NT/.test(platform)) return 'Windows';
  if (/Mac OS X (\d+[._]\d+)/.test(platform)) return 'MacOS';
  if (/Linux (\d+(\.\d+)?)/.test(platform)) return 'Linux';
  if (/Android (\d+(\.\d+)?)/.test(platform)) return 'Android';
  if (/iPhone OS (\d+(_\d+)?)/.test(platform)) return 'iOS';
  return 'Unknown';
};
// 获取系统版本

/** getOSVersion */
export const getOSVersion = (): string => {
  const ua = navigator.userAgent;
  if (/Windows NT 10.0/.test(ua)) return 'Windows 10';
  if (/Windows NT 6.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6.2/.test(ua)) return 'Windows 8';
  if (/Windows NT 6.1/.test(ua)) return 'Windows 7';
  if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    const m = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1];
    const version = m ? m.replace('_', '.') : '';
    return `${version}`;
  }
  if (/Android (\d+(\.\d+)?)/.test(ua)) {
    const version = ua.match(/Android (\d+(\.\d+)?)/)?.[1] || '';
    return `${version}`;
  }
  if (/iPhone OS (\d+(_\d+)?)/.test(ua)) {
    const m = ua.match(/iPhone OS (\d+(_\d+)?)/)?.[1];
    const version = m ? m.replace('_', '.') : '';
    return `${version}`;
  }
  return 'Unknown';
};
// 保留小数（保留原始正负号）

/** ReturnPrecision */
export const ReturnPrecision = (num: any, size: number, type?: any) => {
  const original = String(num).trim();
  const hasType = typeof type !== 'undefined';
  const isNegative = original.startsWith('-');
  let Money = original
    .replace(/[^0-9.]/g, '') // 只允许数字和小数点（临时去掉符号）
    .replace(/^0+(\d)/, '$1') // 去除多余前导0
    .replace(/(\..*?)\..*/g, '$1'); // 保留第一个小数点
  if (size > 0) {
    const reg = new RegExp(`(\\.\\d{${size}}).*`);
    Money = Money.replace(reg, '$1'); // 截取指定小数位
  } else {
    Money = Money.split('.')[0] ?? Money; // 不保留小数部分
  }
  // 需要返回带正负号的字符串形式时
  if (hasType) {
    return (isNegative ? '-' : '+') + Money;
  }
  // 默认返回数字，并恢复原始正负号
  const n = Number(Money || '0');
  return isNegative ? -n : n;
};
/**
 * 虚拟币交易量格式化：
 * - 自动按 K / M / B / T 缩写
 * - 默认保留 2 位小数
 * - 负数会保留符号
 *
 * 例：
 * formatTradeVolume(1234)      => "1.23K"
 * formatTradeVolume(1234567)   => "1.23M"
 * formatTradeVolume(-9876543)  => "-9.88M"
 */
export const formatTradeVolume = (value: string | number, digits = 2): string => {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return '0';
  }
  const num = new Decimal(value);
  const isNegative = num.isNeg();
  const absVal = num.abs();
  const thousand = new Decimal(1000);
  const million = new Decimal(1000000);
  const billion = new Decimal(1000000000);
  const trillion = new Decimal(1000000000000);
  let suffix = '';
  let base = absVal;
  if (absVal.greaterThanOrEqualTo(trillion)) {
    suffix = 'T';
    base = absVal.div(trillion);
  } else if (absVal.greaterThanOrEqualTo(billion)) {
    suffix = 'B';
    base = absVal.div(billion);
  } else if (absVal.greaterThanOrEqualTo(million)) {
    suffix = 'M';
    base = absVal.div(million);
  } else if (absVal.greaterThanOrEqualTo(thousand)) {
    suffix = 'K';
    base = absVal.div(thousand);
  }
  const formatted = base.toDecimalPlaces(digits, Decimal.ROUND_DOWN).toString();
  return (isNegative ? '-' : '') + formatted + suffix;
};
// 封装质押小数位保留

/** decimalCut */
export const decimalCut = (value: any, min = 0.01, decimals = 2) => {
  const val = new Decimal(value);
  const minVal = new Decimal(min);
  // 截断掉浮点误差
  const out = val.toDecimalPlaces(decimals, Decimal.ROUND_DOWN);
  // 最小值保护
  if (out.lessThan(minVal)) {
    return minVal.toFixed(decimals);
  }
  return out.toFixed(decimals);
};
/**
 * 获取币种价格小数位
 */
export const getSymbolPrecision = (symbol: string) => {
  const SystemStore = useSystemStoreWithOut();
  if (!symbol) {
    return false;
  }
  // 获取小数位
  return SystemStore.CoinList.filter((item: any) => item.name === symbol)[0].showPrecision ?? 5;
};
/**
 * 清除 WebView 内 session / localStorage / Cookie / Service Worker / Cache API（不刷新页面）
 * 供网页「清缓存」与原生壳内与文件缓存清理组合使用
 */
export const clearWebViewPersistentData = (): void => {
  sessionStorage.clear();
  localStorage.clear();
  try {
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
  } catch {
    console.log('Cookie清除失败');
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
};
/**
 * 清除缓存（网页端：存储 + SW + Cache API 后刷新并回首页）
 */
export const ClearCacheAll = (): void => {
  clearWebViewPersistentData();
  window.location.reload();
  location.href = '/';
};
// 写入信息

/** setWebSiteContent */
export const setWebSiteContent = (website_name: any): void => {
  document.title = website_name;
  // 插入角标
  // var Link = document.createElement('link');
  // Link.rel = 'icon';
  // Link.href = data.website_favicon;
  // document.getElementsByTagName('head')[0].appendChild(Link);
  // // 插入简介
  // setMeta('description', data.website_description);
  // // 插入关键词
  // setMeta('keywords', data.website_keywords);
};
// 写入meta

/** setMeta */
export const setMeta = (name: string, content: string): void => {
  const oMeta = document.createElement('meta');
  oMeta.name = name;
  oMeta.content = content;
  document.getElementsByTagName('head')[0].appendChild(oMeta);
};
