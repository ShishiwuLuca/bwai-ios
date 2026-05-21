/** EventStackType：接口数据结构定义 */
interface EventStackType {
  [index: string]: CbType[];
}

/** CbType：类型别名 */
type CbType = (data: object) => any;

class EventCenter {
  // 通过事件类型作为属性来管理不通的事件回调
  eventStack: EventStackType = {};

  constructor() {
    this.eventStack = {};
  }

  on(eventName: string, cb: CbType) {
    const { eventStack } = this;
    const eventValue = eventStack[eventName];

    if (eventValue) {
      eventValue.push(cb);
    } else {
      eventStack[eventName] = [cb];
    }
  }

  once(eventName: string, cb: CbType) {
    const { eventStack } = this;
    const eventValue = eventStack[eventName];
    const tempCb = () => {
      let isOutOfDate = false;

      return (data: object) => {
        if (isOutOfDate) return;
        cb(data);
        isOutOfDate = true;
      };
    };

    if (eventValue) {
      eventValue.push(tempCb());
    } else {
      eventStack[eventName] = [tempCb()];
    }
  }

  off(eventName: string, cb: CbType) {
    const { eventStack } = this;
    const eventValue = eventStack[eventName];

    if (!eventValue) return;

    (eventValue || []).forEach((eventCb, index) => {
      if (eventCb === cb) {
        eventValue.splice(index, 1);
      }
    });
  }

  emit(eventName: string, data: object) {
    const { eventStack } = this;
    const eventValue = eventStack[eventName];

    if (!eventValue) return;

    (eventValue || []).forEach((eventCb) => {
      eventCb(data);
    });
  }
}

export default EventCenter;
