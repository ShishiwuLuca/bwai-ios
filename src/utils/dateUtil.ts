/**
 * Independent time operation tool to facilitate subsequent switch to dayjs
 */
import dayjs from 'dayjs';

/** 格式化展示：DATE_TIME_FORMAT */
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** 格式化展示：DATE_FORMAT */
const DATE_FORMAT = 'YYYY-MM-DD';

/** 格式化展示：formatToDateTime */
export const formatToDateTime = (
  date: dayjs.Dayjs | undefined = undefined,
  format = DATE_TIME_FORMAT
): string => {
  return dayjs(date).format(format);
};

/** 格式化展示：formatToDate */
export const formatToDate = (
  date: dayjs.Dayjs | undefined = undefined,
  format = DATE_FORMAT
): string => {
  return dayjs(date).format(format);
};

/** dateUtil */
export const dateUtil = dayjs;
