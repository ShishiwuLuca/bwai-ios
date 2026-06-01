<template>
  <span :style="{ color }">
    {{ value }}
  </span>
</template>
<script lang="ts">
  import { defineComponent, ref, computed, watchEffect, unref, onMounted, watch } from 'vue';
  import { useTransition, TransitionPresets } from '@vueuse/core';
  import { isNumber } from '/@/utils/is';

  // 数字滚动组件：起始值、结束值、动画时长、是否自动播放、小数位、前后缀、千分位等

  /** 常量或静态配置：props */
  const props = {
    /** 起始数字 */
    startVal: { type: Number, default: 0 },
    /** 目标数字 */
    endVal: { type: Number, default: 2021 },
    /** 动画持续时间（毫秒） */
    duration: { type: Number, default: 1500 },
    /** 是否挂载后自动开始动画 */
    autoplay: { type: Boolean, default: true },
    /** 小数位数，需 >= 0 */
    decimals: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0
    },
    /** 数字前前缀字符串 */
    prefix: { type: String, default: '' },
    /** 数字后后缀字符串 */
    suffix: { type: String, default: '' },
    /** 千分位分隔符 */
    separator: { type: String, default: '' },
    /** 小数点字符 */
    decimal: { type: String, default: '.' },
    /** 字体颜色 */
    color: { type: String },
    /** 是否使用缓动函数 */
    useEasing: { type: Boolean, default: true },
    /** 缓动类型（对应 TransitionPresets 的 key） */
    transition: { type: String, default: 'linear' }
  };

  export default defineComponent({
    name: 'CountTo',
    props,
    emits: ['onStarted', 'onFinished'],
    setup(props, { emit }) {
      /** 按 props 格式化为带千分位、小数、前后缀的字符串 */
      const formatNumber = (num: number | string) => {
        if (!num && num !== 0) {
          return '';
        }
        const { decimals, decimal, separator, suffix, prefix } = props;
        let n = Number(num).toFixed(decimals);
        n += '';

        const x = n.split('.');
        let x1: string = x[0] ?? '';
        const x2 = x.length > 1 ? decimal + (x[1] ?? '') : '';

        const rgx = /(\d+)(\d{3})/;
        if (separator && !isNumber(separator)) {
          while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + separator + '$2');
          }
        }
        return prefix + x1 + x2 + suffix;
      };

      // 过渡的源数值，驱动 useTransition
      const source = ref(props.startVal);
      const disabled = ref(false);
      let outputValue = useTransition(source);

      // 格式化后的显示值（加前缀、后缀、千分位等）
      const value = computed(() => formatNumber(unref(outputValue)));

      watchEffect(() => {
        source.value = props.startVal;
      });

      /** 使用 useTransition 执行过渡，并在开始/结束触发 emit */
      const run = () => {
        outputValue = useTransition(source, {
          disabled,
          duration: props.duration,
          onFinished: () => emit('onFinished'),
          onStarted: () => emit('onStarted'),
          ...(props.useEasing
            ? { transition: TransitionPresets[props.transition as keyof typeof TransitionPresets] }
            : {})
        });
      };

      /** 从当前值动画到 endVal */
      const start = () => {
        run();
        source.value = props.endVal;
      };

      /** 重置到 startVal 并重新跑动画 */
      const reset = () => {
        source.value = props.startVal;
        run();
      };

      // startVal / endVal 变化且 autoplay 时重新执行动画
      watch([() => props.startVal, () => props.endVal], () => {
        if (props.autoplay) {
          start();
        }
      });

      onMounted(() => {
        if (props.autoplay) {
          start();
        }
      });

      return { value, start, reset };
    }
  });
</script>
