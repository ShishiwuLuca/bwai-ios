import { getLocalesMessage } from '/@/service/System';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 配置（getServiceLocaleConfig） */
export const getServiceLocaleConfig = async (locale: string) => {
  const SystemStore = useSystemStoreWithOut();

  // 默认语言包
  let langModule = ((await import(`./lang/${locale}.json`)) as any).default;

  // 获取当前语言配置文件路径
  const LocalesInfo = SystemStore.LocaleList.filter((item: any) => item.value === locale)[0];

  // 如果有语言包路径则走服务端获取配置
  if (LocalesInfo && LocalesInfo.path) {
    try {
      // 加载服务端
      const res = await getLocalesMessage(LocalesInfo.path);

      // 兼容两种结构：res[locale] 或 res 直接为对象
      const serverRaw = res && typeof res === 'object' ? (res[locale] ?? res) : null;
      const serverMsg = serverRaw?.default ?? serverRaw;

      // 如果获取到了
      if (serverMsg && typeof serverMsg === 'object') {
        // 如果获取到了服务端的语言包则
        langModule = Object.assign({}, langModule, serverMsg);
      }
    } catch {
      // 服务端加载失败则走本地语言包
    }
  } else {
    // 走本地语言包
    langModule = ((await import(`./lang/${locale}.json`)) as any).default;
  }

  // 返回加载的语言包配置
  return langModule;
};
