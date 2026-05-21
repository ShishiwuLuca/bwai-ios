/** WalletNetworkContext：接口数据结构定义 */
export interface WalletNetworkContext {
  networkCode?: string;
  chainTypeCode?: string;
  chainName?: string;
  text?: string;
}

/** EVM_NETWORK_RE */
const EVM_NETWORK_RE =
  /(ERC|ETH|BEP|BSC|ARB|MATIC|POLYGON|OP|OPTIMISM|AVAX|FTM|FANTOM|BASE|LINEA|HECO|ZKSYNC)/;

/** buildNetworkHint */
const buildNetworkHint = (context?: WalletNetworkContext): string => {
  if (!context) return '';
  return [context.networkCode, context.chainTypeCode, context.chainName, context.text]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
};

/**
 * 按网络做地址基础合法性识别：
 * - TRC/TRON: T 开头 Base58 地址
 * - EVM 链（ERC/BEP/ETH 等）: 0x + 40 位十六进制
 * - BTC: Base58 或 bech32
 * - XRP: r 开头 Base58
 * - 其他网络走通用兜底（长度 + 字符集）
 */
export const isValidWithdrawAddress = (
  rawAddress: unknown,
  networkContext?: WalletNetworkContext
): boolean => {
  const address = String(rawAddress ?? '').trim();
  if (!address || /\s/.test(address)) return false;

  const networkHint = buildNetworkHint(networkContext);

  if (/(TRC|TRON)/.test(networkHint)) {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  }

  if (EVM_NETWORK_RE.test(networkHint)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  if (/(^|[^A-Z])BTC([^A-Z]|$)|BITCOIN|OMNI/.test(networkHint)) {
    return /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address);
  }

  if (/(^|[^A-Z])XRP([^A-Z]|$)|RIPPLE/.test(networkHint)) {
    return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
  }

  return /^[A-Za-z0-9:_-]{16,128}$/.test(address);
};
