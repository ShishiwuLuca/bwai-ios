<template>
  <div ref="chartRef" :style="{ height, width }"></div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import type { PropType, Ref } from 'vue';
  import type { EChartsSourceData } from '/#/views';
  import { useECharts } from '/@/hooks/web/useECharts';

  /** K 线单条数据 [开, 收, 低, 高] */
  type KLineItem = [number, number, number, number];

  // 图表容器宽高、主题色、ECharts 数据（日期/价格/成交量等）

  /** props */
  const props = defineProps({
    /** 图表宽度 */
    width: {
      type: String as PropType<string>,
      default: '100%'
    },
    /** 图表高度 */
    height: {
      type: String as PropType<string>,
      default: '4.8rem'
    },
    /** 主题色数组（未用可保留） */
    color: {
      type: Array as PropType<unknown[]>,
      default: () => []
    },
    /** K 线/成交量等数据，含 dataList、price、volumes */
    echarts: {
      type: Object as PropType<EChartsSourceData>,
      default: (): EChartsSourceData => ({})
    }
  });

  /** 涨/跌颜色 */
  const upColor = ref<string>('#ef232a');

  /** 响应式状态：downColor 相关 UI 或数据 */
  const downColor = ref<string>('#14b143');

  /** 响应式状态：显隐控制 */
  const isShow = ref<boolean>(true);

  /** 计算 N 日移动平均 */
  const calculateMA = (dayCount: number, dataArr: KLineItem[] | undefined): (string | number)[] => {
    const result: (string | number)[] = [];
    if (!dataArr?.length) return result;
    for (let i = 0, len = dataArr.length; i < len; i++) {
      if (i < dayCount) {
        result.push('-');
        continue;
      }
      let sum = 0;
      for (let j = 0; j < dayCount; j++) {
        const item = dataArr[i - j];
        sum += item ? item[1] : 0;
      }
      result.push(Number((sum / dayCount).toFixed(2)));
    }
    return result;
  };

  /** 日期轴、K 线数据、成交量（setOptions 需符合 ECharts 选项类型） */
  const dates = ref<string[]>([]);

  /** 响应式状态：data 相关 UI 或数据 */
  const data = ref<KLineItem[]>([]);

  /** 响应式状态：volumes 相关 UI 或数据 */
  const volumes = ref<number[]>([]);

  /** MA1/MA5/MA10 均线数据 */
  const dataMA1 = ref<(string | number)[]>([]);

  /** 响应式状态：dataMA5 相关 UI 或数据 */
  const dataMA5 = ref<(string | number)[]>([]);

  /** 响应式状态：dataMA10 相关 UI 或数据 */
  const dataMA10 = ref<(string | number)[]>([]);

  // 数据变化时重算均线并刷新图表

  /** 侦听依赖变化并触发副作用 */
  watch(
    () => props.echarts,
    (newValue: EChartsSourceData) => {
      dates.value = (newValue.dataList ?? []) as string[];
      data.value = (newValue.price ?? []) as KLineItem[];
      volumes.value = (newValue.volumes ?? []) as number[];
      dataMA1.value = calculateMA(1, data.value);
      dataMA5.value = calculateMA(5, data.value);
      dataMA10.value = calculateMA(10, data.value);
      CreateCanvas();
    },
    { deep: true }
  );

  /** 响应式状态：chartRef 相关 UI 或数据 */
  const chartRef = ref<HTMLDivElement | null>(null);

  /** 解构赋值：组合式 API 返回的一组方法或状态 */
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  /** 根据当前数据绘制 K 线、成交量与均线 */
  const CreateCanvas = (): void => {
    setOptions({
      animation: isShow.value,
      animationEasing: 'linear',
      axisPointer: {
        link: [
          {
            xAxisIndex: [0, 1]
          }
        ]
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          realtime: false,
          start: 100,
          end: 30,
          top: 65,
          height: 20,
          show: false
        },
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 100,
          end: 30,
          top: 30,
          height: 20
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: dates.value,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#777' } },
          axisLabel: {
            formatter: function (value: any) {
              return value;
            }
          },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            show: true
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates.value,
          boundaryGap: false,
          splitLine: { show: false },
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#777' } },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            type: 'shadow',
            label: { show: false },
            triggerTooltip: true,
            handle: {
              show: false,
              margin: 30,
              color: '#B80C00'
            }
          }
        }
      ],
      yAxis: [
        {
          scale: true,
          splitNumber: 2,
          axisLine: { lineStyle: { color: '#777' } },
          splitLine: { show: true },
          axisTick: { show: false },
          axisLabel: {
            inside: true,
            formatter: '{value}\n'
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      visualMap: {
        show: false,
        seriesIndex: 5,
        dimension: 2,
        pieces: [
          {
            value: 1,
            color: upColor.value
          },
          {
            value: -1,
            color: downColor.value
          }
        ]
      },
      grid: [
        {
          left: 20,
          right: 20,
          top: 50,
          height: 120
        },
        {
          left: 20,
          right: 20,
          height: 40,
          top: 200
        }
      ],
      series: [
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              const item = data.value[params.dataIndex];
              const colorList = item && item[0] > item[1] ? downColor.value : upColor.value;
              return colorList;
            }
          },
          emphasis: {
            itemStyle: {
              color: '#140'
            }
          },
          data: volumes.value as number[]
        },
        {
          type: 'candlestick',
          name: '日K',
          data: data.value,
          itemStyle: {
            color: upColor.value, //'#ef232a',
            color0: downColor.value, //'#14b143',
            borderColor: upColor.value,
            borderColor0: downColor.value
          },
          emphasis: {
            itemStyle: {
              color: 'black',
              color0: '#444',
              borderColor: 'black',
              borderColor0: '#444'
            }
          }
        },
        {
          name: 'MA1',
          type: 'line',
          data: dataMA1.value,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1
          }
        },
        {
          name: 'MA5',
          type: 'line',
          data: dataMA5.value,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1
          }
        },
        {
          name: 'MA10',
          type: 'line',
          data: dataMA10.value,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1
          }
        }
      ]
    });
    isShow.value = false;
  };
</script>

<style lang="less" scoped></style>
