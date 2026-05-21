import type { App } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

/** store */
const store = createPinia();

// Pinia持久化
store.use(piniaPluginPersistedstate);

/** setupStore */
export const setupStore = (app: App<Element>) => {
  app.use(store);
};
export { store };
