import { computed } from 'vue';
import type { App } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import type { RouteRecordRaw } from 'vue-router';
import { useMessage } from '/@/hooks/web/useMessage';
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';

// 路由树

/** 常量或静态配置：routes */
const routes: Array<RouteRecordRaw | any> = [
  // 首页
  {
    name: 'Home',
    path: '/',
    component: () => import('/@/views/Home/Home.vue'),
    meta: { requiresAuth: false, keepAlive: true }
  },
  // AI投资
  {
    name: 'ai',
    path: '/AIInvest',
    component: () => import('/@/views/AIInvest/AIInvest.vue'),
    meta: { requiresAuth: true }
  },
  // AI购买
  {
    name: 'AIBuy',
    path: '/AIBuy',
    component: () => import('/@/views/AIInvest/components/AIBuy.vue'),
    meta: { requiresAuth: true }
  },
  // AI投资我的订单
  {
    name: 'AIInvestMyOrder',
    path: '/MyOrder',
    component: () => import('/@/views/AIInvest/components/MyOrder.vue'),
    meta: { requiresAuth: true }
  },
  // AI投资订单详情
  {
    name: 'OrderDetails',
    path: '/OrderDetails',
    component: () => import('/@/views/AIInvest/components/OrderDetails.vue'),
    meta: { requiresAuth: true }
  },
  // AI购买
  {
    name: 'AIBuy',
    path: '/AIBuy',
    component: () => import('/@/views/AIInvest/components/AIBuy.vue'),
    meta: { requiresAuth: true }
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
  // 每日任务
  {
    name: 'DailyTask',
    path: '/DailyTask',
    component: () => import('/@/views/DailyTask/DailyTask.vue'),
    meta: { requiresAuth: true }
  },
  // 每日任务详情
  {
    name: 'SalaryDetail',
    path: '/SalaryDetail',
    component: () => import('/@/views/DailyTask/SalaryDetail.vue'),
    meta: { requiresAuth: true }
  },
  // 每日任务2
  {
    name: 'Task2',
    path: '/Task/2',
    component: () => import('/@/views/DailyTask/Task2.vue'),
    meta: { requiresAuth: true }
  },
  // 每日任务3
  {
    name: 'Task3',
    path: '/Task/3',
    component: () => import('/@/views/DailyTask/Task3.vue'),
    meta: { requiresAuth: true }
  },
  // 关于我们
  {
    name: 'About',
    path: '/About',
    component: () => import('/@/views/About/About.vue'),
    meta: { requiresAuth: false }
  },
  // 社区
  {
    name: 'Community',
    path: '/Community',
    component: () => import('/@/views/Community/Community.vue'),
    meta: { requiresAuth: false }
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
  // 钱包
  {
    name: 'Wallet',
    path: '/Wallet',
    component: () => import('/@/views/Wallet/Wallet.vue'),
    meta: { requiresAuth: true }
  },
  // 充币
  {
    name: 'Recharge',
    path: '/Wallet/Recharge',
    component: () => import('/@/views/Wallet/Recharge.vue'),
    meta: { requiresAuth: true }
  },
  // 提币
  {
    name: 'Withdraw',
    path: '/Wallet/Withdraw',
    component: () => import('/@/views/Wallet/Withdraw.vue'),
    meta: { requiresAuth: true }
  },
  // 地址簿
  {
    name: 'AddressBook',
    path: '/AddressBook',
    component: () => import('/@/views/Wallet/AddressBook.vue'),
    meta: { requiresAuth: true }
  },
  // 转账
  {
    name: 'Transfer',
    path: '/Wallet/Transfer',
    component: () => import('/@/views/Wallet/Transfer.vue'),
    meta: { requiresAuth: true }
  },
  // 账户
  {
    name: 'Account',
    path: '/Wallet/Account',
    component: () => import('/@/views/Wallet/Account.vue'),
    meta: { requiresAuth: true }
  },
  // 交易记录
  {
    name: 'TransactionHistory',
    path: '/Wallet/TransactionHistory',
    component: () => import('/@/views/Wallet/TransactionHistory.vue'),
    meta: { requiresAuth: true }
  },
  // 团队
  {
    name: 'Team',
    path: '/Team',
    component: () => import('/@/views/Team/Team.vue'),
    meta: { requiresAuth: true }
  },
  // 我的团队下级
  {
    name: 'MyTeamSub',
    path: '/Team/Sub',
    component: () => import('/@/views/Team/MyTeamSub.vue'),
    meta: { requiresAuth: true }
  },
  // VIP奖励明细
  {
    name: 'VIPRewardDetail',
    path: '/Team/VIPReward',
    component: () => import('/@/views/Team/VIPRewardDetail.vue'),
    meta: { requiresAuth: true }
  },
  // 推荐奖励明细
  {
    name: 'ReferralRewardDetail',
    path: '/Team/ReferralReward',
    component: () => import('/@/views/Team/ReferralRewardDetail.vue'),
    meta: { requiresAuth: true }
  },
  // 投资列表
  {
    name: 'InvestList',
    path: '/Invest',
    component: () => import('/@/views/Invest/InvestList.vue'),
    meta: { requiresAuth: true }
  },
  // 投资申购
  {
    name: 'InvestJoin',
    path: '/Invest/Join',
    component: () => import('/@/views/Invest/InvestJoin.vue'),
    meta: { requiresAuth: true }
  },
  // 我的订单
  {
    name: 'MyOrder',
    path: '/MyOrder',
    component: () => import('/@/views/Invest/MyOrder.vue'),
    meta: { requiresAuth: true }
  },
  // 订单详情
  {
    name: 'OrderDetail',
    path: '/OrderDetail',
    component: () => import('/@/views/Invest/OrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  // 条款
  {
    name: 'Terms',
    path: '/Terms',
    component: () => import('/@/views/Settings/Terms.vue'),
    meta: { requiresAuth: true }
  },
  // 邀请
  {
    name: 'Invite',
    path: '/Invite',
    component: () => import('/@/views/Settings/Invite.vue'),
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
  // 设置交易密码
  {
    name: 'TradePassword',
    path: '/TradePassword',
    component: () => import('/@/views/Settings/TradePassword.vue'),
    meta: { requiresAuth: true }
  },
  // 谷歌验证码
  {
    name: 'GoogleCode',
    path: '/GoogleCode',
    component: () => import('/@/views/Settings/GoogleCode.vue'),
    meta: { requiresAuth: true }
  },
  // 添加地址
  {
    name: 'AddAddress',
    path: '/AddAddress',
    component: () => import('/@/views/Wallet/AddAddress.vue'),
    meta: { requiresAuth: true }
  },
  // 编辑地址
  {
    name: 'EditAddress',
    path: '/EditAddress',
    component: () => import('/@/views/Wallet/EditAddress.vue'),
    meta: { requiresAuth: true }
  },
  // 排行榜
  {
    name: 'Rank',
    path: '/Rank',
    component: () => import('/@/views/Rank/Rank.vue'),
    meta: { requiresAuth: true }
  },
  {
    name: 'RankRecord',
    path: '/Rank/Record',
    component: () => import('/@/views/Rank/RankRecords.vue'),
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
  },
  // 下载页面
  {
    name: 'Download',
    path: '/Download',
    component: () => import('/@/views/Download/Download.vue'),
    meta: { requiresAuth: false }
  },
  // 团队权益
  {
    name: 'TeamBenefits',
    path: '/TeamBenefits',
    component: () => import('/@/views/Settings/TeamBenefits.vue'),
    meta: { requiresAuth: true }
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

router.beforeEach((_to, _from) => {
  const { t } = useI18n();

  const { CreateConfirmDialog } = useMessage();

  const UserStore = useUserStoreWithOut();

  const requiresAuth = _to.matched.some((record) => record.meta.requiresAuth);

  if (UserStore.getToken) {
    // 会员信息
    const UserInfo: any = computed(() => {
      return UserStore.getUserInfo;
    });

    // 提现页面校验
    if (_to.name === 'Withdraw') {
      if (UserInfo.value.capitalPasswordSet === false) {
        CreateConfirmDialog({
          title: t('common_title_text'),
          message: t('str_set_trade_password_value'),
          confirmButtonText: t('str_set_trade_password_button'),
          cancelButtonText: t('common_text_btnCancel')
        })
          .then(() => {
            router.push('/TradePassword');
          })
          .catch(() => {
            // 如果已经在提现页面则回退
            if (location.pathname === '/Withdraw') {
              router.back();
            }
          });
        return false;
      }
    }
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
