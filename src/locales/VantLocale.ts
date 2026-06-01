import { ref } from 'vue';
import { Locale } from 'vant';
import type { LocaleType } from '/#/config';

// 引入英文语言包
import enUS from 'vant/es/locale/lang/en-US';

// 引入简体中文语言包
import zhCN from 'vant/es/locale/lang/zh-CN';

// 引入台湾繁体中文语言包
import zhTW from 'vant/es/locale/lang/zh-TW';

// 引入香港繁体中文语言包
import zhHK from 'vant/es/locale/lang/zh-HK';

// 引入日牙语语言包
import jaJP from 'vant/es/locale/lang/ja-JP';

// 引入韩语语言包
import koKR from 'vant/es/locale/lang/ko-KR';

// 引入阿拉伯语语言包
import arAE from 'vant/es/locale/lang/ar-SA';

// 引入法语语言包
import frFR from 'vant/es/locale/lang/fr-FR';

// 引入西班牙语语言包
import esES from 'vant/es/locale/lang/es-ES';

// 引入葡萄牙语语言包
import ptBR from 'vant/es/locale/lang/pt-BR';

// 引入泰语语言包
import thTH from 'vant/es/locale/lang/th-TH';

// 引入德语语言包
import deDE from 'vant/es/locale/lang/de-DE-formal';

// 引入印地语
import hiIN from 'vant/es/locale/lang/hi-IN';

// 引入印尼语
import idID from 'vant/es/locale/lang/id-ID';

// 引入波斯语
import faIR from 'vant/es/locale/lang/fa-IR';

// 引入俄语
import ruRU from 'vant/es/locale/lang/ru-RU';

// 引入越南语
import viVN from 'vant/es/locale/lang/vi-VN';

// 引入土耳其语
import trTR from 'vant/es/locale/lang/tr-TR';

// 引入孟加拉语
import bnBD from 'vant/es/locale/lang/bn-BD';

// 引入巴基斯坦语
import urPK from './vant/urPK';

// 引入立陶宛语
import ltLT from './vant/ltLT';

// 引入罗马尼亚语
import roRO from 'vant/es/locale/lang/ro-RO';

// 引入荷兰语
import nlNL from 'vant/es/locale/lang/nl-NL';

// 意大利语
import itIT from 'vant/es/locale/lang/it-IT';

// 波兰语
import plPL from 'vant/es/locale/lang/pl-PL';

// 乌克兰语
import ukUA from 'vant/es/locale/lang/uk-UA';

// 保加利亚语
import bgBG from 'vant/es/locale/lang/bg-BG';

// 哈萨克语
import kkKZ from 'vant/es/locale/lang/kk-KZ';

// 塞尔维亚语
import srRS from 'vant/es/locale/lang/sr-RS';

// 克罗地亚语
import hrHR from './vant/hrHR';

// 匈牙利语
import huHU from './vant/huHU';

// 斯洛伐克语
import skSK from './vant/skSK';

// 斯瓦希里语
import swKE from './vant/swKE';

// 希腊语
import elGR from 'vant/es/locale/lang/el-GR';

// 蒙古语
import mnMN from 'vant/es/locale/lang/mm-MN';

// 希伯来语
import heIL from 'vant/es/locale/lang/he-IL';

// 埃塞俄比亚语
import amET from './vant/amET';

// 亚美尼亚语
import hyAM from './vant/hyAM';

// 乌兹别克语
import uzUZ from './vant/uzUZ';

// 切换UI库默认语言

/** setVantLocales */
export const setVantLocales = (lang: LocaleType): void => {
  const Locales = ref<object>({});
  switch (lang) {
    // 简体中文
    case 'zh_CN':
      Locales.value = zhCN;
      break;

    // 英语
    case 'en_US':
      Locales.value = enUS;
      break;

    // 繁体中文
    case 'zh_TW':
      Locales.value = zhTW;
      break;

    // 繁体中文香港
    case 'zh_HK':
      Locales.value = zhHK;
      break;

    // 日语
    case 'ja_JP':
      Locales.value = jaJP;
      break;

    // 韩语
    case 'ko_KR':
      Locales.value = koKR;
      break;

    // 阿拉伯语
    case 'ar_AE':
      Locales.value = arAE;
      break;

    // 法语
    case 'fr_FR':
      Locales.value = frFR;
      break;

    // 西班牙语
    case 'es_ES':
      Locales.value = esES;
      break;

    // 葡萄牙语
    case 'pt_BR':
      Locales.value = ptBR;
      break;

    // 泰语
    case 'th_TH':
      Locales.value = thTH;
      break;

    // 德语
    case 'de_DE':
      Locales.value = deDE;
      break;

    // 印地语
    case 'hi_IN':
      Locales.value = hiIN;
      break;

    // 印尼语
    case 'id_ID':
      Locales.value = idID;
      break;

    // 波斯语
    case 'fa_IR':
      Locales.value = faIR;
      break;

    // 俄语
    case 'ru_RU':
      Locales.value = ruRU;
      break;

    // 越南语
    case 'vi_VN':
      Locales.value = viVN;
      break;

    // 土耳其语
    case 'tr_TR':
      Locales.value = trTR;
      break;

    // 孟加拉语
    case 'bn_BD':
      Locales.value = bnBD;
      break;

    // 巴基斯坦语
    case 'ur_PK':
      Locales.value = urPK;
      break;

    // 立陶宛语
    case 'lt_LT':
      Locales.value = ltLT;
      break;

    // 罗马尼亚语
    case 'ro_RO':
      Locales.value = roRO;
      break;

    // 引入荷兰语
    case 'nl_NL':
      Locales.value = nlNL;
      break;

    // 意大利语
    case 'it_IT':
      Locales.value = itIT;
      break;

    // 波兰语
    case 'pl_PL':
      Locales.value = plPL;
      break;

    // 乌克兰语
    case 'uk_UA':
      Locales.value = ukUA;
      break;

    // 保加利亚语
    case 'bg_BG':
      Locales.value = bgBG;
      break;

    // 哈萨克语
    case 'kk_KZ':
      Locales.value = kkKZ;
      break;

    // 塞尔维亚语
    case 'sr_RS':
      Locales.value = srRS;
      break;

    // 克罗地亚语
    case 'hr_HR':
      Locales.value = hrHR;
      break;

    // 匈牙利语
    case 'hu_HU':
      Locales.value = huHU;
      break;

    // 斯洛伐克语
    case 'sk_SK':
      Locales.value = skSK;
      break;

    // 斯瓦希里语
    case 'sw_KE':
      Locales.value = swKE;
      break;

    // 希腊语
    case 'el_GR':
      Locales.value = elGR;
      break;

    // 蒙古语
    case 'mn_MN':
      Locales.value = mnMN;
      break;

    // 希伯来语
    case 'he_IL':
      Locales.value = heIL;
      break;

    // 埃塞俄比亚
    case 'am_ET':
      Locales.value = amET;
      break;

    // 亚美尼亚语
    case 'hy_AM':
      Locales.value = hyAM;
      break;

    // 乌兹别克语
    case 'uz_UZ':
      Locales.value = uzUZ;
      break;
  }

  // 写入语言
  Locale.use(lang, Locales.value);
};
