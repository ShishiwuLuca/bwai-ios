/**
 * 深色/浅色主题工具
 * - 按时间或手动切换主题
 * - 同步 Store 与 DOM 主题
 * - 监听系统主题变化
 */
import Dayjs from 'dayjs';
import { ref, computed } from 'vue';
import { ThemeEnum } from '/@/enums/appEnum';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { updateDarkTheme } from '/@/logics/theme/dark';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { useSystemStoreWithOut } from '/@/stores/modules/SystemConfig';

/** 夜间模式开始小时（>= 此值视为夜间） */
const NIGHT_START_HOUR = 19;

/** 夜间模式结束小时（< 此值视为夜间） */
const NIGHT_END_HOUR = 8;

/** 根据当前时间是否处于夜间区间 */
const isNightByHour = (hour: number): boolean => hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;

/** 应用主题到 Store 与 DOM */
const applyTheme = (mode: ThemeEnum): void => {
  const systemStore = useSystemStoreWithOut();
  systemStore.setDarkMode(mode);
  updateDarkTheme(mode);
};

/**
 * 切换主题：支持按时间自动切换（Dark=true）或手动切换（Dark=false）
 * @param Dark 为 true 时按当前时间在 19:00~08:00 内自动切夜间/日间并弹窗；为 false 时仅做一次手动亮/暗切换
 */
export const MonitoringTheme = (Dark?: boolean): void => {
  const systemStore = useSystemStoreWithOut();
  const userStore = useUserStoreWithOut();
  const { CreateAlertDialog } = useMessage();
  const { t } = useI18n();

  const currentMode = computed(() => systemStore.getDarkMode);
  const hour = Number(Dayjs().format('HH'));
  const hasToken = computed(() => !!userStore.getToken);
  const darkMode = ref<ThemeEnum>(currentMode.value);

  if (Dark && hasToken.value) {
    if (isNightByHour(hour)) {
      if (currentMode.value === ThemeEnum.LIGHT) {
        darkMode.value = ThemeEnum.DARK;
        CreateAlertDialog({
          title: t('common_title_text'),
          message: t('sys_darkMode_dark')
        });
      }
    } else {
      if (currentMode.value === ThemeEnum.DARK) {
        darkMode.value = ThemeEnum.LIGHT;
        CreateAlertDialog({
          title: t('common_title_text'),
          message: t('sys_darkMode_light')
        });
      }
    }
  } else if (!Dark) {
    darkMode.value = currentMode.value === ThemeEnum.DARK ? ThemeEnum.LIGHT : ThemeEnum.DARK;
  }

  applyTheme(darkMode.value);
};

/**
 * 监听系统主题（prefers-color-scheme）变化并同步到应用主题
 */
export const WatchSystemTheme = (): void => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    const mode = e.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT;
    applyTheme(mode);
  };
  media.addEventListener('change', handleChange);
};
