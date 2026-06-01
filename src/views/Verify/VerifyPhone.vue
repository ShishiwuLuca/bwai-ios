<template>
  <PageWrap class="verify-page">
    <NavBar title="手机验证" fixed placeholder :border="false" />
    <div class="verify-page__body">
      <p class="verify-page__label">请输入手机验证码</p>
      <div class="verify-page__inputs">
        <input
          v-for="(_, i) in 6"
          :key="i"
          v-model="codes[i]"
          ref="inputRefs"
          type="text"
          maxlength="1"
          class="verify-page__input"
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
        />
      </div>
      <div class="verify-page__actions">
        <Button size="small" type="primary" @click="sendCode">发送</Button>
        <span class="verify-page__countdown">{{ countdown }}秒后重新获取</span>
      </div>
    </div>
  </PageWrap>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { NavBar, PageWrap } from '/@/components';
  import { Button } from 'vant';

  /** 六位验证码每位一格 */
  const codes = reactive<string[]>(['', '', '', '', '', '']);

  /** 响应式状态：inputRefs 相关 UI 或数据 */
  const inputRefs = ref<(HTMLInputElement | null)[]>([]);

  /** 发送验证码倒计时秒数 */
  const countdown = ref<number>(60);

  /** 输入时自动聚焦下一格 */
  const onInput = (i: number, e: Event): void => {
    const v = (e.target as HTMLInputElement).value;
    if (v && i < 5) inputRefs.value[i + 1]?.focus();
  };

  /** 退格时聚焦上一格 */
  const onKeydown = (i: number, e: KeyboardEvent): void => {
    if (e.key === 'Backspace' && !codes[i] && i > 0) inputRefs.value[i - 1]?.focus();
  };

  /** 发送手机验证码（待对接） */
  const sendCode = (): void => {
    console.log('send');
  };
</script>

<style scoped lang="less">
  .verify-page {
    color: var(--van-text-color);
  }

  .verify-page__body {
    padding: 0.4rem 0.32rem;
  }

  .verify-page__label {
    font-size: 0.28rem;
    margin-bottom: 0.3rem;
    text-align: center;
  }

  .verify-page__inputs {
    display: flex;
    justify-content: center;
    gap: 0.16rem;
    margin-bottom: 0.4rem;
  }

  .verify-page__input {
    width: 0.8rem;
    height: 0.8rem;
    text-align: center;
    font-size: 0.36rem;
    background: var(--van-field-background);
    border: 1px dashed var(--van-border-color);
    border-radius: 0.12rem;
    color: var(--van-text-color);
  }

  .verify-page__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
  }

  .verify-page__countdown {
    font-size: 0.24rem;
    opacity: 0.8;
  }
</style>
