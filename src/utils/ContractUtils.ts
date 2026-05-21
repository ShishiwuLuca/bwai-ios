import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/**
 * 计算汇率
 * @param price 价格
 * @param exrate 汇率配置
 * @param market 币种
 * @returns
 */
export const fixRate = (price: string | number, market: string) => {
  const SystemStore = useSystemStoreWithOut();

  // 当前语言标识
  const lang = SystemStore.localInfo.locale;

  // 汇率
  const ExRate = SystemStore.SymbolRate;

  if (!ExRate) {
    return '--';
  }
  const larate = (ExRate[lang] || ExRate.en_US) as Record<string, unknown> & {
    symbolPrecision?: number;
    coin_precision?: number;
    lang_logo?: string;
  };
  if (!larate) {
    return '--';
  }
  const pric = (Number(larate[market]) || 0) * parseFloat(price);
  if (`${parseFloat(pric)}` !== 'NaN') {
    const rate =
      typeof larate.symbolPrecision !== 'undefined'
        ? larate.symbolPrecision
        : larate.coin_precision;
    return (larate.lang_logo ?? '') + pric.toFixed(Number(rate) || 0);
  }
  return '--';
};

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
export const setDepthData = (symbol: any, data: any, depthValue: number) => {
  let dataTypeKey: any = {};
  try {
    dataTypeKey = Object.keys(data);
  } catch {
    return false;
  }
  const priceFix = depthValue || 2;
  const volumeFix = symbol.coinResultVo.symbolPricePrecision || 0;
  const marketName = symbol.quote;
  const depthListData: any = {};
  let maxTotal = 0;

  dataTypeKey.forEach((item: string) => {
    if (item !== 'newData') {
      const objItem = data[item];
      let totalNum = 0;
      let maxVal = 0;
      const dataArr: any = [];
      let objKeys: any = null;
      if (item === 'asks') {
        objKeys = Object.keys(objItem).sort((a: any, b: any) => a - b);
      } else {
        objKeys = Object.keys(objItem).sort((a: any, b: any) => b - a);
      }
      // 去掉 价格为零的
      objKeys.forEach((itemKey: any, _index: any) => {
        const itemArr = objItem[itemKey];
        if (Number(fixD(itemArr[1], priceFix)) !== 0 && dataArr.length < 150 && itemArr[1]) {
          // 获取最大的数量
          maxVal = maxVal < itemArr[1] ? itemArr[1] : maxVal;

          totalNum += itemArr[1];
          const ratePrice = fixRate(itemArr[0], marketName);
          const objd = {
            rate: ratePrice,
            total: fixD(totalNum, volumeFix),
            price: fixD(itemArr[0], volumeFix),
            vol: fixD(itemArr[1], priceFix),
            diff: itemArr[1]
          };
          // 处理增量数据
          if (data.newData && data.newData.indexOf(itemArr[0]) < 0) {
            objd.diff = 0;
          }
          dataArr.push(objd);
        }
      });

      depthListData[item] = dataArr;
      if (maxTotal < maxVal) {
        maxTotal = maxVal;
      }
    }
  });

  return {
    symbol: symbol.base,
    depthMaxNumber: maxTotal,
    asks: depthListData.asks
      .map((item: any) => {
        const numberSize = (parseFloat(item.vol) / parseFloat(maxTotal)) * 100;

        item.rateNumber = (
          Math.floor(numberSize * Math.pow(10, 2)) / Math.pow(10, volumeFix)
        ).toFixed(2);

        // 处理转换vol
        item.vol = Number(item.vol);

        return item;
      })
      .sort((a: any, b: any) => b.rateNumber - a.rateNumber),
    buys: depthListData.buys
      .map((item: any) => {
        const numberSize = (parseFloat(item.vol) / parseFloat(maxTotal)) * 100;

        item.rateNumber = (
          Math.floor(numberSize * Math.pow(10, 2)) / Math.pow(10, volumeFix)
        ).toFixed(2);

        // 处理转换vol
        item.vol = Number(item.vol);
        return item;
      })
      .sort((a: any, b: any) => b.rateNumber - a.rateNumber)
  };
};

/**
 * 计算持仓盈亏
 * @param {object} symbol 币种信息
 * @param {object} item 订单信息
 * @param {object} params 平仓参数
 * @param {object} SymbolConfig 币种配置
 * @returns {string} 盈亏金额字符串
 */
export const calcPositionProfit = (symbol: any, item: any, params: any, SymbolConfig: any) => {
  const UserStore = useUserStoreWithOut();

  if (!params.price || !params.volume) return '--';

  const UserConfig: any = UserStore.UserConfig;

  const isOpenRealizedAmount = false;

  let parValue = symbol.multiplier;

  // 币本位未开启已实现盈亏时，面值设为1
  if (!isOpenRealizedAmount && UserConfig.coUnit === 1) {
    parValue = '1';
  }

  const amountNum = parseFloat(params.volume);
  const openingPriceNum = parseFloat(item.openAvgPrice);
  const tagPriceNum = parseFloat(params.price);
  const marginRateNum = parseFloat(symbol.marginRate);
  const parValueNum = parseFloat(parValue);

  let result = 0;

  if (symbol.contractSide === 1) {
    // 正向合约
    if (item.orderSide === 'BUY') {
      // 做多
      result = (tagPriceNum - openingPriceNum) * amountNum * parValueNum * marginRateNum;
    } else {
      // 做空
      result = (openingPriceNum - tagPriceNum) * amountNum * parValueNum * marginRateNum;
    }
  } else {
    // 反向合约
    const base = amountNum * parValueNum;
    const value1 = base / openingPriceNum;
    const value2 = base / tagPriceNum;

    if (item.orderSide === 'BUY') {
      // 做多
      result = value1 - value2;
    } else {
      // 做空
      result = value2 - value1;
    }
  }

  // 返回保留精度的结果
  return result.toFixed(SymbolConfig.price);
};
