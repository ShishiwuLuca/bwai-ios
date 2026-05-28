import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
import { isHiddenHomeEntryEnabled } from '/@/utils/hiddenHomeEntry';
import { ensureVestConfigLoaded, isVestHomeMode } from '/@/utils/vestConfig';

// 路由树

/** 常量或静态配置：routes */
const routes: Array<RouteRecordRaw | any> = [
  // 首页（社区）
  {
    name: 'Community',
    path: '/',
    component: () => import('/@/views/Community/Community.vue'),
    meta: { requiresAuth: false, keepAlive: true }
  },
  // 隐藏入口解锁后的 Home 页
  {
    name: 'Home',
    path: '/Home',
    component: () => import('/@/views/Home/Home.vue'),
    meta: { requiresAuth: false, keepAlive: true }
  },
  // 登录
  {
    name: 'Login',
    path: '/Login',
    component: () => import('/@/views/Login/Login.vue'),
    meta: { requiresAuth: false }
  },
  // 注册
  {
    name: 'Register',
    path: '/Register',
    component: () => import('/@/views/Register/Register.vue'),
    meta: { requiresAuth: false }
  },
  // 忘记密码
  {
    name: 'ForgotPassword',
    path: '/ForgotPassword',
    component: () => import('/@/views/ForgotPassword/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  // 验证邮箱
  {
    name: 'VerifyEmail',
    path: '/VerifyEmail',
    component: () => import('/@/views/Verify/VerifyEmail.vue'),
    meta: { requiresAuth: false }
  },
  // 验证手机号
  {
    name: 'VerifyPhone',
    path: '/VerifyPhone',
    component: () => import('/@/views/Verify/VerifyPhone.vue'),
    meta: { requiresAuth: false }
  },
  // 个人中心
  {
    name: 'Personal',
    path: '/Personal',
    component: () => import('/@/views/Personal/Personal.vue'),
    meta: { requiresAuth: true }
  },
  // 社区（旧路径兼容）
  {
    path: '/Community',
    redirect: '/'
  },
  // 我的社区
  {
    name: 'MyCommunity',
    path: '/MyCommunity',
    component: () => import('/@/views/Community/MyCommunity.vue'),
    meta: { requiresAuth: true }
  },
  // 我的消息
  {
    name: 'MyMessage',
    path: '/MyMessage',
    component: () => import('/@/views/Community/MyMessage.vue'),
    meta: { requiresAuth: true }
  },
  // 发布帖子
  {
    name: 'PublishPost',
    path: '/PublishPost',
    component: () => import('/@/views/Community/PublishPost.vue'),
    meta: { requiresAuth: true }
  },
  // 举报
  {
    name: 'Report',
    path: '/Report',
    component: () => import('/@/views/Community/Report.vue'),
    meta: { requiresAuth: true }
  },
  // 帖子详情
  {
    name: 'PostDetail',
    path: '/PostDetail',
    component: () => import('/@/views/Community/PostDetail.vue'),
    meta: { requiresAuth: true }
  },
  // 条款
  {
    name: 'Terms',
    path: '/Terms',
    component: () => import('/@/views/Settings/Terms.vue'),
    meta: { requiresAuth: true }
  },
  // 用户权益
  {
    name: 'UserBenefits',
    path: '/UserBenefits',
    component: () => import('/@/views/Settings/UserBenefits.vue'),
    meta: { requiresAuth: true }
  },
  // 升级用户信息
  {
    name: 'UpgradeUserInfo',
    path: '/UpgradeUserInfo',
    component: () => import('../views/Settings/UpgradeUserInfo.vue'),
    meta: { requiresAuth: true }
  },
  // 安全设置
  {
    name: 'SecuritySettings',
    path: '/SecuritySettings',
    component: () => import('/@/views/Settings/SecuritySettings.vue'),
    meta: { requiresAuth: true }
  },
  // 绑定手机号
  {
    name: 'BindPhone',
    path: '/BindPhone',
    component: () => import('/@/views/Settings/BindPhone.vue'),
    meta: { requiresAuth: true }
  },
  // 绑定邮箱
  {
    name: 'BindEmail',
    path: '/BindEmail',
    component: () => import('/@/views/Settings/BindEmail.vue'),
    meta: { requiresAuth: true }
  },
  // 修改密码
  {
    name: 'ChangePassword',
    path: '/ChangePassword',
    component: () => import('/@/views/Settings/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },
  // 空视图
  {
    name: 'EmptyView',
    path: '/:pathMath(.*)',
    component: () => import('/@/views/EmptyView/EmptyView.vue'),
    meta: { requiresAuth: false }
  },
  // 公告列表
  {
    name: 'NoticeList',
    path: '/Notice',
    component: () => import('/@/views/Notice/NoticeList.vue'),
    meta: { requiresAuth: false }
  },
  // 公告详情
  {
    name: 'NoticeDetail',
    path: '/Notice/Detail',
    component: () => import('/@/views/Notice/NoticeDetail.vue'),
    meta: { requiresAuth: false }
  },
  // 文章详情
  {
    name: 'ArticleDetail',
    path: '/ArticleDetail',
    component: () => import('/@/views/Article/ArticleDetail.vue'),
    meta: { requiresAuth: false }
  }
];

// 创建路由

/** 路由实例：router */
export const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (_to.hash) return { el: _to.hash };
    return { top: 0 };
  }
});

// 注册路由

/** setupRouter */
export const setupRouter = (app: App): void => {
  app.use(router);
};

router.beforeEach(async (_to, _from) => {
  const UserStore = useUserStoreWithOut();

  const isInitialNavigation = _from.matched.length === 0;
  const isCommunityEntry =
    _to.path === '/' || _to.path === '/Community' || _to.name === 'Community';

  if (isInitialNavigation && isCommunityEntry) {
    await ensureVestConfigLoaded();
    if (isVestHomeMode()) {
      return { name: 'Home', replace: true };
    }
  }

  if (isHiddenHomeEntryEnabled() && isInitialNavigation && isCommunityEntry) {
    return { name: 'Home', replace: true };
  }

  const requiresAuth = _to.matched.some((record) => record.meta.requiresAuth);

  if (UserStore.getToken) {
    return true;
  }

  if (requiresAuth) {
    return {
      path: '/Login',
      query: { active: '1' }
    };
  }

  return true;
});
