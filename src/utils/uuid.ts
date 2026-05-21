/** 0–15 与十六进制字符映射表，供 buildUUID 随机位使用 */
const hexList: string[] = [];
for (let i = 0; i <= 15; i++) {
  hexList[i] = i.toString(16);
}

/** 生成无连字符的 32 位十六进制 UUID 字符串（随机） */
export const buildUUID = (): string => {
  let uuid = '';
  for (let i = 1; i <= 36; i++) {
    if (i === 9 || i === 14 || i === 19 || i === 24) {
      uuid += '-';
    } else if (i === 15) {
      uuid += 4;
    } else if (i === 20) {
      uuid += hexList[(Math.random() * 4) | 8];
    } else {
      uuid += hexList[(Math.random() * 16) | 0];
    }
  }
  return uuid.replace(/-/g, '');
};

/** buildShortUUID 调用计数，避免同一毫秒内碰撞 */
let unique = 0;

/** 生成带前缀的短唯一 id：前缀 + 随机数 + 递增计数 + 时间戳 */
export const buildShortUUID = (prefix = ''): string => {
  const time = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  unique++;
  return prefix + '_' + random + unique + String(time);
};
