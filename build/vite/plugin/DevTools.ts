import viteVueDevTools from 'vite-plugin-vue-devtools';

export const configDevTools = (isBuild: boolean) => {
  if (isBuild === false) {
    return viteVueDevTools();
  } else {
    return [];
  }
};