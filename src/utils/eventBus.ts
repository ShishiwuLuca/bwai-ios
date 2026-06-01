import { reactive } from 'vue';

/** Callback：类型别名 */
type Callback = (payload?: unknown) => void;

/** EventBus：接口数据结构定义 */
interface EventBus {
  [event: string]: Callback[];
}

/** 响应式对象：eventBus */
export const eventBus: EventBus = reactive({});

/** emitEvent */
export const emitEvent = (event: string, payload?: unknown) => {
  if (!eventBus[event]) {
    eventBus[event] = [];
  }
  eventBus[event].forEach((callback) => callback(payload));
};

/** 事件或回调处理：onEvent */
export const onEvent = (event: string, callback: Callback) => {
  if (!eventBus[event]) {
    eventBus[event] = [];
  }
  eventBus[event].push(callback);
};

/** offEvent */
export const offEvent = (event: string, callback: Callback): void => {
  const list = eventBus[event];
  if (!list?.length) return;
  const idx = list.indexOf(callback);
  if (idx >= 0) {
    list.splice(idx, 1);
  }
};
