/**
 * 与 getTeamRewardLevelSetting 响应对齐的团队等级奖励展示模型
 *（字段键名在 normalizeRow 中做兼容）
 */
export type TeamRewardCard = {
  level: number;
  fundAmount: number;
  pointSum: number;
  jrate: number;
  erate: number;
  brate: number;
};

/** pickNum */
const pickNum = (obj: Record<string, unknown>, ...keys: string[]): number => {
  for (const k of keys) {
    const v = Number(obj[k]);
    if (Number.isFinite(v)) return v;
  }
  return 0;
};

/** 列表数据：extractList */
const extractList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { list?: unknown }).list)
  ) {
    return (payload as { list: Record<string, unknown>[] }).list;
  }
  return [];
};

/** parseRowLevel */
const parseRowLevel = (raw: Record<string, unknown>, index: number): number => {
  const n = pickNum(raw, 'level', 'levelNo', 'vipLevel', 'agentLevel', 'sort', 'id');
  if (n > 0) return Math.round(n);
  const name = String(raw.name ?? raw.levelName ?? raw.levelStr ?? '');
  const m = name.match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  return index + 1;
};

/** normalizeRow */
const normalizeRow = (raw: Record<string, unknown>, index: number): TeamRewardCard => {
  const level = parseRowLevel(raw, index);
  return {
    level,
    fundAmount: pickNum(
      raw,
      'fundAmount',
      'teamFundAmount',
      'minTeamInvest',
      'investAmount',
      'amount',
      'totalFund'
    ),
    pointSum: pickNum(raw, 'pointSum', 'promotionPoint', 'point', 'upgradePoint', 'points'),
    jrate: pickNum(raw, 'jrate', 'jRate', 'levelDiffRate', 'diffRate'),
    erate: pickNum(raw, 'erate', 'eRate', 'peerRate', 'sameLevelRate'),
    brate: pickNum(raw, 'brate', 'bRate', 'leapRate', 'crossRate', 'skipRate')
  };
};

/** 将 getTeamRewardLevelSetting 的 data 转为去重、按 level 升序的卡片列表 */
export const buildTeamRewardCardsFromPayload = (data: unknown): TeamRewardCard[] => {
  const list = extractList(data);
  if (list.length === 0) return [];
  const rows = list.map((row, i) => normalizeRow(row, i));
  const byLevel = new Map<number, TeamRewardCard>();
  for (const r of rows) {
    byLevel.set(r.level, r);
  }
  return [...byLevel.values()].sort((a, b) => a.level - b.level);
};

/** 从 userInfo 解析当前 VIP 数字等级（与团队权益页一致） */
export const getUserVipLevel = (u: Record<string, unknown> | null | undefined): number => {
  if (!u || typeof u !== 'object') return 0;
  const nameMatch = String((u as { level?: { name?: string } }).level?.name ?? '').match(/(\d+)/);
  if (nameMatch) return parseInt(nameMatch[1], 10);
  const n = Number(
    (u as { level?: { level?: number }; vipLevel?: number; levelNo?: number }).level?.level ??
      (u as { vipLevel?: number }).vipLevel ??
      (u as { levelNo?: number }).levelNo
  );
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return 0;
};

/**
 * 在配置表里取与当前 VIP 对应的一条：优先同等级，否则取已配置中不超过用户等级且 level 最大的一条
 */
export const getTeamRewardCardForUserVip = (
  cards: TeamRewardCard[],
  userVip: number
): TeamRewardCard | null => {
  if (!cards.length || userVip <= 0) return null;
  const byLevel = new Map(cards.map((c) => [c.level, c] as const));
  const exact = byLevel.get(userVip);
  if (exact) return exact;
  const atOrBelow = cards.filter((c) => c.level <= userVip);
  if (atOrBelow.length) {
    return [...atOrBelow].sort((a, b) => b.level - a.level)[0];
  }
  return null;
};
