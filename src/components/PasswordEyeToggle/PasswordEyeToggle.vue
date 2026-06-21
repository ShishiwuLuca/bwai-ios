<template>
  <span class="page-shell__eye-toggle" @click.stop="emit('click')">
    <img
      class="page-shell__eye-icon"
      :src="visible ? EyeOpenIcon : EyeCloseIcon"
      alt=""
    />
  </span>
</template>

<script setup lang="ts">
  import EyeOpenIcon from '/@/assets/svg/eye_open.svg';
  import EyeCloseIcon from '/@/assets/svg/eye_close.svg';

  defineProps<{
    visible: boolean;
  }>();

  const emit = defineEmits<{
    click: [];
  }>();
</script>
