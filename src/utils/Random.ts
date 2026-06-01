/**
 * 生成数字
 * @param min number 最小数字
 * @param max number 最大数字
 * @param item object 游戏信息
 */
export const RandomNumber = (min: number, max: number, item: any) => {
  // 生成的数字数组
  const NumberArr: object[] = [];

  for (let k = min; k < max; k++) {
    NumberArr.push({
      cateTag: item.cateTag,
      code: item.code,
      gcode: item.gcode,
      name: String(k),
      odds: item.odds,
      ptCode: item.ptCode,
      checked: false,
      betContent: String(k),
      color: AnimalNumberColor(k)
    });
  }

  return NumberArr;
};

// 动物运动会生成号码对应颜色

/** AnimalNumberColor */
export const AnimalNumberColor = (name: number) => {
  let Color = '';

  switch (Number(name)) {
    case 1:
      Color = '#378bff';
      break;

    case 2:
      Color = '#00e8e4';
      break;

    case 3:
      Color = '#5820f4';
      break;

    case 4:
      Color = '#ed7c00';
      break;

    case 5:
      Color = '#e2e000';
      break;

    case 6:
      Color = '#6b6f73';
      break;
  }

  return Color;
};

/**
 * 生成大小单双
 * @param item object 游戏信息
 */
export const RandomZoidc = (item: any) => {
  return [
    {
      cateTag: item.cateTag,
      code: item.code,
      gcode: item.gcode,
      name: 'Big',
      betContent: 'B',
      odds: item.odds,
      ptCode: item.ptCode,
      checked: false
    },
    {
      cateTag: item.cateTag,
      code: item.code,
      gcode: item.gcode,
      name: 'Small',
      betContent: 'S',
      odds: item.odds,
      ptCode: item.ptCode,
      checked: false
    },
    {
      cateTag: item.cateTag,
      code: item.code,
      gcode: item.gcode,
      name: 'Odd',
      betContent: 'O',
      odds: item.odds,
      ptCode: item.ptCode,
      checked: false
    },
    {
      cateTag: item.cateTag,
      code: item.code,
      gcode: item.gcode,
      name: 'Even',
      betContent: 'E',
      odds: item.odds,
      ptCode: item.ptCode,
      checked: false
    }
  ];
};

/**
 * 处理排列三/福彩3D游戏数据
 * @param item object 游戏信息
 */
export const Pick3PlayUtils = (item: any) => {
  // 截取code
  const code = item.code.slice(-3);
  switch (code) {
    case '-s4':
      // 大小单双
      item.children.map((child: any) => {
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        // 如果是和值
        if (child.code.includes('-s4-1')) {
          // 生成玩法按钮数据
          child.children = RandomZoidc(child);
        } else if (child.code.includes('-s4-2')) {
          // 前二
          child.children = [
            {
              title: 'game.百位',
              code: child.code,
              odds: child.odds,
              children: RandomZoidc(child)
            },
            { title: 'game.十位', code: child.code, odds: child.odds, children: RandomZoidc(child) }
          ];
        } else if (child.code.includes('-s4-3')) {
          // 后二
          child.children = [
            {
              title: 'game.十位',
              code: child.code,
              odds: child.odds,
              children: RandomZoidc(child)
            },
            { title: 'game.个位', code: child.code, odds: child.odds, children: RandomZoidc(child) }
          ];
        }
        return child;
      });
      break;

    case '-s2':
      // 不定位
      item.children.map((child: any) => {
        // 生成玩法按钮数据
        child.children = RandomNumber(0, 10, child);
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        return child;
      });
      break;

    case '-s7':
      // 定位胆
      item.children.map((child: any) => {
        // 生成玩法按钮数据
        child.children = RandomNumber(0, 10, child);
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        return child;
      });
      break;

    case '-s1':
      // 三码组选
      item.children.map((child: any) => {
        // 生成玩法按钮数据
        child.children = RandomNumber(0, 10, child);
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        return child;
      });
      break;

    case '-s8':
      // 三码和值增加checked字段
      item.children.map((child: any) => {
        child.checked = false;
        // 下注内容
        child.betContent = child.name;
        return child;
      });
      // 选中数量
      item.badge = 0;
      // 规则说明
      item.rule = `game.${item.showName}_rule`;
      break;

    case '-s5':
      // 三码直选增加是否为输入框字段
      item.children.map((child: any) => {
        child.isInput = true;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        // 提示内容
        child.tips = [`game.${child.name}_tips_1`, `game.自动过滤_tips_2`];
        return child;
      });
      break;

    case '-s3':
      // 前二增加是否为输入框字段
      item.children.map((child: any) => {
        child.isInput = true;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        // 提示内容
        child.tips = [`game.多注号码_tips_1`, `game.自动过滤_tips_2`];
        return child;
      });
      break;

    case '-s6':
      // 后二增加是否为输入框字段
      item.children.map((child: any) => {
        child.isInput = true;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `game.${child.name}_rule`;
        // 提示内容
        child.tips = [`game.多注号码_tips_1`, `game.自动过滤_tips_2`];
        return child;
      });
      break;
  }

  return item;
};

/**
 * 处理动物运动会游戏数据
 * @param item object 游戏信息
 */
export const AnimalGamesUtils = (item: any) => {
  // 截取code
  const code = item.code.slice(-3);
  switch (code) {
    case '-s6':
      // 大小单双
      item.children.map((child: any) => {
        // 截取排序id
        child.sort = child.code.slice(-1);
        // 生成玩法按钮数据
        child.children = RandomZoidc(child);
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `${child.name}_tips`;
        return child;
      });

      // 重新排序
      item.children = item.children.sort(
        (a: { sort: number }, b: { sort: number }) => a.sort - b.sort
      );
      break;

    case '-s5':
      // 定位胆
      item.children.map((child: any) => {
        // 生成玩法按钮数据
        child.children = RandomNumber(1, 7, child);
        // 关闭输入框模式
        child.isInput = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `${child.name}_tips`;
        return child;
      });
      break;

    case '-s7':
      // 冠亚和
      // 增加checked字段
      item.children.map((child: any) => {
        child.checked = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `${child.name}_tips`;
        return child;
      });
      break;

    case '-s8':
      // 冠亚季和
      // 增加checked字段
      item.children.map((child: any) => {
        child.checked = false;
        // 选中数量
        child.badge = 0;
        // 规则说明
        child.rule = `${child.name}_tips`;
        return child;
      });
      break;
  }

  return item;
};

/**
 * 处理赛车游戏数据
 * @param item object 游戏信息
 */
export const RacePlayUtils = (item: any) => {
  // 增加checked字段
  item.children.map((child: any) => {
    child.checked = false;
  });

  return item;
};

/**
 * 处理太空骰子游戏数据
 * @param item object 游戏信息
 */
export const SpaceDiceUtils = (item: any) => {
  item.children = item.children.map((child: any) => {
    // 切割号码
    child.children = child.name.split(',');

    // 如果当前是AllAAA
    if (child.code.includes('-s5-7')) {
      child.children = [
        ['1', '1', '1', '4', '4', '4'],
        ['2', '2', '2', '5', '5', '5'],
        ['3', '3', '3', '6', '6', '6']
      ];
    }

    return {
      cateTag: child.cateTag,
      checked: false,
      code: child.code,
      gcode: child.gcode,
      name: child.name,
      children: child.children,
      odds: child.odds,
      ptCode: child.ptCode,
      betContent: child.name
    };
  });

  // 重新排序
  item.children = item.children.sort(
    (a: { sortNo: number }, b: { sortNo: number }) => a.sortNo - b.sortNo
  );
  return item;
};

/**
 * 处理胜利转盘游戏数据
 * @param item object 游戏信息
 */
export const VictoryWheelUtils = (gamePlayItems: any[], gamePlayTypes: any[]) => {
  const List = [
    {
      showName: '玩法一',
      cateTag: null,
      gcode: gamePlayTypes[0].gcode,
      code: gamePlayTypes[0].code,
      children: gamePlayItems
        .filter((item) => item.name !== undefined && /^[0-9]+$/.test(String(item.name)))
        .map((next: any) => {
          next.checked = false;
          return next;
        })
    },
    {
      showName: '玩法二',
      cateTag: null,
      gcode: gamePlayTypes[0].gcode,
      code: gamePlayTypes[0].code,
      children: gamePlayItems
        .filter((item) => item.name === 'G' || item.name === 'R' || item.name === 'P')
        .map((next: any) => {
          next.checked = false;
          return next;
        })
    },
    {
      showName: '玩法三',
      cateTag: null,
      gcode: gamePlayTypes[0].gcode,
      code: gamePlayTypes[0].code,
      children: gamePlayItems
        .filter(
          (item) =>
            item.name === 'Big' ||
            item.name === 'Small' ||
            item.name === 'Odd' ||
            item.name === 'Even'
        )
        .map((next: any) => {
          next.checked = false;
          return next;
        })
    }
  ];

  return List;
};

// 随机生成指定范围内的序号

/** 常量或静态配置：订单 */
export const randomdOrder = (ordderNumber = 4, allNumbers = [0, 1, 2, 3, 4, 5]) => {
  const numbers: number[] = [];
  // 随机选择四个不同的数字
  while (numbers.length < ordderNumber) {
    const randomIndex = Math.floor(Math.random() * allNumbers.length);
    const randomNum = allNumbers[randomIndex] ?? 0;
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }
  return numbers;
};

/**
 * 生成指定范围内的指定数量随机数
 * @param {number} min - 范围的最小值（包含）
 * @param {number} max - 范围的最大值（包含）
 * @param {number} count - 要生成的随机数数量
 * @param {boolean} unique - 是否生成唯一的随机数（默认为 true）
 * @returns {number[]} 随机数数组
 */
export const generateRandomNumbers = (min: number = 0, max: number, maxCount: number): number[] => {
  // 检查输入范围
  if (min > max) {
    throw new Error('最小值不能大于最大值');
  }

  // 确保最大数量不超过范围内的数字总数
  const range = max - min + 1;
  if (maxCount > range) {
    throw new Error('最大数量不能超过范围内的数字总数');
  }

  // 随机生成数量（最少生成1个，最多生成 maxCount 个）
  const count = Math.floor(Math.random() * maxCount) + 1;

  const numbers: any = [];
  const usedNumbers = new Set();

  while (numbers.length < count) {
    const randomNum: any = Math.floor(Math.random() * range) + min;
    if (!usedNumbers.has(randomNum)) {
      numbers.push(randomNum);
      usedNumbers.add(randomNum);
    }
  }
  return numbers;
};
