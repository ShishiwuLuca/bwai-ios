<template>
  <div class="ai-chat-page">
    <NavBar :title="t('ai_assist_title')" />
    <!-- 消息列表 -->
    <div class="ai-chat-page__messages" ref="MessageListRef">
      <div
        v-for="(msg, idx) in Messages"
        :key="idx"
        class="ai-chat-page__message-row"
        :class="msg.role === 'user' ? 'ai-chat-page__message-row--user' : 'ai-chat-page__message-row--ai'"
      >
        <!-- AI 消息 -->
        <template v-if="msg.role === 'ai'">
          <div class="ai-chat-page__avatar ai-chat-page__avatar--ai shrink-0">
            <VanImage :src="AiIcon" width="0.72rem" height="0.72rem" fit="contain" />
          </div>
          <div class="ai-chat-page__bubble ai-chat-page__bubble--ai">{{ msg.content }}</div>
        </template>
        <!-- 用户消息 -->
        <template v-else>
          <div class="ai-chat-page__avatar ai-chat-page__avatar--user shrink-0">
            <VanImage :src="UserAvatar" width="0.72rem" height="0.72rem" fit="cover" round />
          </div>
          <div class="ai-chat-page__bubble ai-chat-page__bubble--user">{{ msg.content }}</div>
        </template>
      </div>
      <!-- AI 输入中 -->
      <div v-if="Thinking" class="ai-chat-page__message-row ai-chat-page__message-row--ai">
        <div class="ai-chat-page__avatar ai-chat-page__avatar--ai shrink-0">
          <VanImage :src="AiIcon" width="0.72rem" height="0.72rem" fit="contain" />
        </div>
        <div class="ai-chat-page__bubble ai-chat-page__bubble--ai ai-chat-page__bubble--thinking">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>
      </div>
    </div>
    <!-- 输入栏 -->
    <div class="ai-chat-page__input-bar">
      <div class="ai-chat-page__input-wrap">
        <Field
          v-model="InputText"
          :placeholder="t('ai_assist_input_placeholder')"
          :border="false"
          class="ai-chat-page__input"
          @keyup.enter="sendMessage"
        />
        <div class="ai-chat-page__send-btn" @click="sendMessage">
          <VanImage :src="MsgSendIcon" width="0.6rem" height="0.6rem" fit="contain" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { ref, nextTick } from 'vue';
  import AiIcon from '/@/assets/images/ai_icon.png';
  import AvatarDefault from '/@/assets/images/avatar_default.png';
  import MsgSendIcon from '/@/assets/images/msg_send.png';
  import { Image as VanImage, Field } from 'vant';
  import { NavBar } from '/@/components';
  import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
  import { computed } from 'vue';

  const { t } = useI18n();
  const UserStore = useUserStoreWithOut();

  const UserInfo: any = computed(() => UserStore.getUserInfo);
  const UserAvatar = computed(() => UserInfo.value?.avatar || AvatarDefault);

  interface Message {
    role: 'ai' | 'user';
    content: string;
  }

  const Messages = ref<Message[]>([
    { role: 'ai', content: t('ai_assist_welcome') }
  ]);

  const InputText = ref('');
  const Thinking = ref(false);
  const MessageListRef = ref<HTMLElement | null>(null);

  const scrollToBottom = () => {
    nextTick(() => {
      if (MessageListRef.value) {
        MessageListRef.value.scrollTop = MessageListRef.value.scrollHeight;
      }
    });
  };

  const sendMessage = () => {
    const text = InputText.value.trim();
    if (!text || Thinking.value) return;
    Messages.value.push({ role: 'user', content: text });
    InputText.value = '';
    Thinking.value = true;
    scrollToBottom();
    // 预留接口对接位置
    setTimeout(() => {
      Thinking.value = false;
      Messages.value.push({ role: 'ai', content: t('ai_assist_default_reply') });
      scrollToBottom();
    }, 1200);
  };
</script>

<style lang="less" scoped>
  .ai-chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f2f5fe url('/images/login_bg.png') no-repeat top center / cover;

    :deep(.van-nav-bar) {
      background: #fff !important;
      box-shadow: 0 1px 4px rgba(87, 119, 251, 0.1);
    }

    :deep(.van-nav-bar__title) {
      font-size: 16px;
      font-weight: 600;
      color: #000;
    }

    :deep(.van-nav-bar .van-icon) {
      color: #000 !important;
    }
  }

  .ai-chat-page__messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.32rem;
    display: flex;
    flex-direction: column;
    gap: 0.32rem;
    padding-bottom: 1.6rem;
  }

  .ai-chat-page__message-row {
    display: flex;
    align-items: flex-start;
    gap: 0.2rem;

    &--user {
      flex-direction: row-reverse;
    }
  }

  .ai-chat-page__avatar {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;

    &--ai {
      background: linear-gradient(135deg, #e8f0ff 0%, #d0e0ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .ai-chat-page__bubble {
    position: relative;
    max-width: 72%;
    padding: 0.2rem 0.28rem;
    border-radius: 8px;
    font-size: 0.28rem;
    line-height: 1.6;
    word-break: break-word;

    &--ai {
      background: #fff;
      color: #222;
      box-shadow: 0 1px 4px rgba(87, 119, 251, 0.12);

      &::before {
        content: '';
        position: absolute;
        top: 0.14rem;
        left: -0.14rem;
        border-width: 0.1rem 0.14rem 0.1rem 0;
        border-style: solid;
        border-color: transparent #fff transparent transparent;
      }
    }

    &--user {
      background: #f9faff;
      color: #000;
      box-shadow: 0 1px 4px rgba(87, 119, 251, 0.12);

      &::before {
        content: '';
        position: absolute;
        top: 0.14rem;
        right: -0.14rem;
        border-width: 0.1rem 0 0.1rem 0.14rem;
        border-style: solid;
        border-color: transparent transparent transparent #f9faff;
      }
    }

    &--thinking {
      display: flex;
      align-items: center;
      gap: 0.12rem;
      padding: 0.24rem 0.32rem;

      .dot {
        display: inline-block;
        width: 0.12rem;
        height: 0.12rem;
        border-radius: 50%;
        background: #2071f8;
        animation: dot-bounce 1.2s infinite ease-in-out;

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }

  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .ai-chat-page__input-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.2rem 0.32rem;
    padding-bottom: calc(0.2rem + env(safe-area-inset-bottom));
    background: transparent;
  }

  .ai-chat-page__input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    background: #f9faff;
    border-radius: 0.48rem;
    box-shadow: 0 2px 8px rgba(87, 119, 251, 0.15);
    overflow: hidden;
  }

  .ai-chat-page__input {
    flex: 1;
    min-width: 0;
    --van-cell-background: transparent;
    --van-field-background: transparent;

    :deep(.van-cell) {
      background: transparent;
      padding: 0.2rem 0.28rem;
      padding-right: 0.96rem;
    }

    :deep(.van-field__control) {
      font-size: 0.28rem;
      color: #000;

      &::placeholder {
        color: #bbb;
      }
    }
  }

  .ai-chat-page__send-btn {
    position: absolute;
    right: 0.12rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.6rem;
    height: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ai-chat-page__send-btn {
    width: 0.72rem;
    height: 0.72rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
