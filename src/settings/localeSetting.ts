import type { LocaleSetting, LocaleType } from '/#/config';

/** 常量或静态配置：LOCALE */
export const LOCALE = {
  // 简体中文
  ZH_CN: 'zh_CN',
  // 英语
  EN_US: 'en_US',
  // 繁体中文
  ZH_TW: 'zh_TW',
  // 繁体中文香港
  ZH_HK: 'zh_HK',
  // 日语
  JA_JP: 'ja_JP',
  // 韩语
  KO_KR: 'ko_KR',
  // 阿拉伯语
  AR_AE: 'ar_AE',
  // 法语
  FR_FR: 'fr_FR',
  // 西班牙语
  ES_ES: 'es_ES',
  // 葡萄牙语
  PT_BR: 'pt_BR',
  // 泰语
  TH_TH: 'th_TH',
  // 德语
  DE_DE: 'de_DE',
  // 俄语
  RU_RU: 'ru_RU',
  // 越南语
  VI_VN: 'vi_VN',
  // 土耳其语
  TR_TR: 'tr_TR',
  // 印尼语
  ID_ID: 'id_ID',
  // 印度语
  HI_IN: 'hi_IN',
  // 波斯语
  FA_IR: 'fa_IR',
  // 巴基斯坦语
  UR_PK: 'ur_PK',
  // 孟加拉语
  BN_BD: 'bn_BD',
  // 立陶宛语
  LT_LT: 'lt_LT',
  // 罗马尼亚语
  RO_RO: 'ro_RO',
  // 引入荷兰语
  NL_NL: 'nl_NL',
  // 意大利语
  IT_IT: 'it_IT',
  // 波兰语
  PL_PL: 'pl_PL',
  // 乌克兰语
  UK_UA: 'uk_UA',
  // 保加利亚语
  BG_BG: 'bg_BG',
  // 哈萨克语
  KK_KZ: 'kk_KZ',
  // 塞尔维亚语
  SR_RS: 'sr_RS',
  // 克罗地亚语
  HR_HR: 'hr_HR',
  // 匈牙利语
  HU_HU: 'hu_HU',
  // 斯洛伐克语
  SK_SK: 'sk_SK',
  // 斯瓦希里语
  SW_KE: 'sw_KE',
  // 希腊语
  EL_GR: 'el_GR',
  // 蒙古语
  MN_MN: 'mn_MN',
  // 希伯来语
  HE_IL: 'he_IL',
  // 埃塞俄比亚语
  AM_ET: 'am_ET',
  // 亚美尼亚语
  HY_AM: 'hy_AM',
  // 乌兹别克语
  UZ_UZ: 'uz_UZ'
} as const satisfies Record<string, LocaleType>;

// 获取语言Icon

/** getLocaleIcon */
const getLocaleIcon = (keys: string) => {
  return new URL(`../assets/country/${keys}.svg`, import.meta.url).href;
};

/** 常量或静态配置：localeSetting */
export const localeSetting: LocaleSetting = {
  // 是否显示语言选择器
  showPicker: true,
  // 当前语言
  locale: LOCALE.ZH_CN,
  // 默认语言
  fallback: LOCALE.ZH_CN,
  // 图标
  icon: getLocaleIcon('cn'),
  // 语言名称
  label: '简体中文',
  // 允许的语言
  availableLocales: [
    // 简体中文
    LOCALE.ZH_CN,
    // 英语
    LOCALE.EN_US,
    // 繁体中文
    LOCALE.ZH_TW,
    // 繁体中文香港
    LOCALE.ZH_HK,
    // 日语
    LOCALE.JA_JP,
    // 韩语
    LOCALE.KO_KR,
    // 阿拉伯语
    LOCALE.AR_AE,
    // 法语
    LOCALE.FR_FR,
    // 西班牙语
    LOCALE.ES_ES,
    // 葡萄牙语
    LOCALE.PT_BR,
    // 泰语
    LOCALE.TH_TH,
    // 德语
    LOCALE.DE_DE,
    // 俄语
    LOCALE.RU_RU,
    // 越南语
    LOCALE.VI_VN,
    // 土耳其语
    LOCALE.TR_TR,
    // 印尼语
    LOCALE.ID_ID,
    // 印度语
    LOCALE.HI_IN,
    // 波斯语
    LOCALE.FA_IR,
    // 巴基斯坦语
    LOCALE.UR_PK,
    // 孟加拉语
    LOCALE.BN_BD,
    // 立陶宛语
    LOCALE.LT_LT,
    // 罗马尼亚语
    LOCALE.RO_RO,
    // 引入荷兰语
    LOCALE.NL_NL,
    // 意大利语
    LOCALE.IT_IT,
    // 波兰语
    LOCALE.PL_PL,
    // 乌克兰语
    LOCALE.UK_UA,
    // 保加利亚语
    LOCALE.BG_BG,
    // 哈萨克语
    LOCALE.KK_KZ,
    // 塞尔维亚语
    LOCALE.SR_RS,
    // 克罗地亚语
    LOCALE.HR_HR,
    // 匈牙利语
    LOCALE.HU_HU,
    // 斯洛伐克语
    LOCALE.SK_SK,
    // 斯瓦希里语
    LOCALE.SW_KE,
    // 希腊语
    LOCALE.EL_GR,
    // 蒙古语
    LOCALE.MN_MN,
    // 希伯来语
    LOCALE.HE_IL,
    // 埃塞俄比亚语
    LOCALE.AM_ET,
    // 亚美尼亚语
    LOCALE.HY_AM,
    // 乌兹别克语
    LOCALE.UZ_UZ
  ]
};

// 语言列表

/** 常量或静态配置：列表数据 */
export const localeList = [
  // 简体中文
  {
    label: '简体中文',
    value: LOCALE.ZH_CN,
    key: 'cn',
    checked: false,
    icon: getLocaleIcon('cn')
  },
  // 英语
  {
    label: 'English',
    value: LOCALE.EN_US,
    key: 'us',
    checked: false,
    icon: getLocaleIcon('us')
  },
  // 繁体中文
  {
    label: '繁體中文',
    value: LOCALE.ZH_TW,
    key: 'tw',
    checked: false,
    icon: getLocaleIcon('tw')
  },
  // 繁体中文
  {
    label: '繁體中文',
    value: LOCALE.ZH_HK,
    key: 'hk',
    checked: false,
    icon: getLocaleIcon('hk')
  },
  // 日语
  {
    label: '日本語',
    value: LOCALE.JA_JP,
    key: 'ja',
    checked: false,
    icon: getLocaleIcon('ja')
  },
  // 韩语
  {
    label: '한국어',
    value: LOCALE.KO_KR,
    key: 'ko',
    checked: false,
    icon: getLocaleIcon('ko')
  },
  // 阿拉伯语
  {
    label: 'العربية',
    value: LOCALE.AR_AE,
    key: 'sa',
    checked: false,
    icon: getLocaleIcon('sa')
  },
  // 法语
  {
    label: 'Français',
    value: LOCALE.FR_FR,
    key: 'fr',
    checked: false,
    icon: getLocaleIcon('fr')
  },
  // 西班牙语
  {
    label: 'Español',
    value: LOCALE.ES_ES,
    key: 'es',
    checked: false,
    icon: getLocaleIcon('es')
  },
  // 葡萄牙语
  {
    label: 'Português-BR',
    value: LOCALE.PT_BR,
    key: 'pt',
    checked: false,
    icon: getLocaleIcon('pt')
  },
  // 泰语
  {
    label: 'ภาษาไทย',
    value: LOCALE.TH_TH,
    key: 'th',
    checked: false,
    icon: getLocaleIcon('th')
  },
  // 德语
  {
    label: 'Deutsch',
    value: LOCALE.DE_DE,
    key: 'de',
    checked: false,
    icon: getLocaleIcon('de')
  },
  // 俄语
  {
    label: 'русский язык',
    value: LOCALE.RU_RU,
    key: 'ru',
    checked: false,
    icon: getLocaleIcon('ru')
  },
  // 越南语
  {
    label: 'Tiếng Việt',
    value: LOCALE.VI_VN,
    key: 'vn',
    checked: false,
    icon: getLocaleIcon('vn')
  },
  // 土耳其语
  {
    label: 'Türkçe',
    value: LOCALE.TR_TR,
    key: 'tr',
    checked: false,
    icon: getLocaleIcon('tr')
  },
  // 印尼语
  {
    label: 'Bahasa Indonesia',
    value: LOCALE.ID_ID,
    key: 'id',
    checked: false,
    icon: getLocaleIcon('id')
  },
  // 印度语
  {
    label: 'हिन्दी',
    value: LOCALE.HI_IN,
    key: 'in',
    checked: false,
    icon: getLocaleIcon('in')
  },
  // 波斯语
  {
    label: 'فارسی',
    value: LOCALE.FA_IR,
    key: 'ir',
    checked: false,
    icon: getLocaleIcon('ir')
  },
  // 巴基斯坦语
  {
    label: 'اردو',
    value: LOCALE.UR_PK,
    key: 'pk',
    checked: false,
    icon: getLocaleIcon('pk')
  },
  // 孟加拉语
  {
    label: 'বাংলা',
    value: LOCALE.BN_BD,
    key: 'bd',
    checked: false,
    icon: getLocaleIcon('bd')
  },
  // 立陶宛语
  {
    label: 'lietuvių',
    value: LOCALE.LT_LT,
    key: 'lt',
    checked: false,
    icon: getLocaleIcon('lt')
  },
  // 罗马尼亚语
  {
    label: 'română',
    value: LOCALE.RO_RO,
    key: 'ro',
    checked: false,
    icon: getLocaleIcon('ro')
  },
  // 引入荷兰语
  {
    label: 'Nederlands',
    value: LOCALE.NL_NL,
    key: 'nl',
    checked: false,
    icon: getLocaleIcon('nl')
  },
  // 意大利语
  {
    label: 'Italiano',
    value: LOCALE.IT_IT,
    key: 'it',
    checked: false,
    icon: getLocaleIcon('it')
  },
  // 波兰语
  {
    label: 'Polski',
    value: LOCALE.PL_PL,
    key: 'pl',
    checked: false,
    icon: getLocaleIcon('pl')
  },
  // 乌克兰语
  {
    label: 'Українська',
    value: LOCALE.UK_UA,
    key: 'ua',
    checked: false,
    icon: getLocaleIcon('ua')
  },
  // 保加利亚语
  {
    label: 'български',
    value: LOCALE.BG_BG,
    key: 'bg',
    checked: false,
    icon: getLocaleIcon('bg')
  },
  // 哈萨克语
  {
    label: 'қазақша',
    value: LOCALE.KK_KZ,
    key: 'kz',
    checked: false,
    icon: getLocaleIcon('kz')
  },
  // 塞尔维亚语
  {
    label: 'српски',
    value: LOCALE.SR_RS,
    key: 'rs',
    checked: false,
    icon: getLocaleIcon('rs')
  },
  // 克罗地亚语
  {
    label: 'hrvatski',
    value: LOCALE.HR_HR,
    key: 'hr',
    checked: false,
    icon: getLocaleIcon('hr')
  },
  // 匈牙利语
  {
    label: 'magyar',
    value: LOCALE.HU_HU,
    key: 'hu',
    checked: false,
    icon: getLocaleIcon('hu')
  },
  // 斯洛伐克语
  {
    label: 'slovenčina',
    value: LOCALE.SK_SK,
    key: 'sk',
    checked: false,
    icon: getLocaleIcon('sk')
  },
  // 斯瓦希里语
  {
    label: 'Kiswahili',
    value: LOCALE.SW_KE,
    key: 'ke',
    checked: false,
    icon: getLocaleIcon('ke')
  },
  // 希腊语
  {
    label: 'ελληνικά',
    value: LOCALE.EL_GR,
    key: 'gr',
    checked: false,
    icon: getLocaleIcon('gr')
  },
  // 蒙古语
  {
    label: 'Монгол хэл',
    value: LOCALE.MN_MN,
    key: 'mn',
    checked: false,
    icon: getLocaleIcon('mn')
  },
  // 希伯来语
  {
    label: 'עברית',
    value: LOCALE.HE_IL,
    key: 'il',
    checked: false,
    icon: getLocaleIcon('il')
  },
  // 埃塞俄比亚语
  {
    label: 'አማርኛ',
    value: LOCALE.AM_ET,
    key: 'et',
    checked: false,
    icon: getLocaleIcon('et')
  },
  // 亚美尼亚语
  {
    label: 'Armenian',
    value: LOCALE.HY_AM,
    key: 'am',
    checked: false,
    icon: getLocaleIcon('am')
  },
  // 乌兹别克语
  {
    label: 'Uzbek',
    value: LOCALE.UZ_UZ,
    key: 'uz',
    checked: false,
    icon: getLocaleIcon('uz')
  }
];
