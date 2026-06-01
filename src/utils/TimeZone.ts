import dayTime from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import { useI18n } from '/@/hooks/web/useI18n';

dayTime.extend(utc);
dayTime.extend(duration);
dayTime.extend(timezone);

// 获取当前时区编码

/** ThisZoneCode */
export const ThisZoneCode = dayTime.tz.guess();

// 设置默认时区
dayTime.tz.setDefault(ThisZoneCode);

// 转换时间

/** ServerTimeTo */
export const ServerTimeTo = (time: string) => {
  // 将时间转换为指定时区时间
  return dayTime(time);
};

// 获取时间

/** getToDateTime */
export const getToDateTime = (time?: string) => {
  return time ? dayTime(time).tz(ThisZoneCode) : dayTime().tz(ThisZoneCode);
};

// 转换时间

/** 格式化展示：TimeToFormat */
export const TimeToFormat = (time: any, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  // 将时间转换为指定时区时间
  return dayTime.tz(time, ThisZoneCode).format(format);
};

// 获取近期的开始和结束时间

/** getLastDateTime */
export const getLastDateTime = (start: number, end: number) => {
  return [
    getToDateTime().subtract(start, 'day').hour(23).minute(59).second(59).valueOf(),
    getToDateTime().subtract(end, 'day').hour(0).minute(0).second(0).valueOf()
  ];
};

// 获取今日开始时间与结束时间

/** getToDayTime */
export const getToDayTime = (start: number, end: number) => {
  return [
    getToDateTime().subtract(start, 'day').hour(0).minute(0).second(0),
    getToDateTime().subtract(end, 'day').hour(23).minute(59).second(59)
  ];
};

// 获取时间戳位于多久前

/** fromNow */
export const fromNow = (time: number) => {
  const { t } = useI18n();

  // 当前时间戳/毫秒
  const ThisTime = new Date().getTime();

  // 计算时间戳/秒
  const Seconds = (ThisTime - time) / 1000;

  // 判断时间位于多久前
  if (Seconds < 60) {
    return t(`otc_second`);
  }
};

/** 格式化展示：formatMilliseconds */
export const formatMilliseconds = (ms: any) => {
  const { t } = useI18n();

  const d = dayTime.duration(ms);

  const days = d.days();
  const hours = d.hours();
  const minutes = d.minutes();

  return days + t(`noun_date_day`) + hours + t(`noun_date_hour`) + minutes + t(`noun_date_minute`);
};

/**
 * 获取某个时间戳与现在的相对时间描述(几天前、几小时前等)
 * @param {number} timestamp - 目标时间戳(单位：毫秒)
 * @returns {string} 相对时间字符串
 */
export const timeAgo = (timestamp: number): string => {
  const { t } = useI18n();

  const now = dayTime();

  const target = dayTime.unix(timestamp / 1000);

  const diffInSeconds = now.diff(target, 'second');
  if (diffInSeconds < 60) {
    return t('num_second', [diffInSeconds]);
  }

  const diffInMinutes = now.diff(target, 'minute');
  if (diffInMinutes < 60) {
    return t('num_minutes', [diffInMinutes]);
  }

  const diffInHours = now.diff(target, 'hour');
  if (diffInHours < 24) {
    return t('num_hours', [diffInHours]);
  }

  const diffInDays = now.diff(target, 'day');
  return t('num_days', [diffInDays]);
};
