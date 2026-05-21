/**
 * Web3钱包链接
 */
import Web3 from 'web3';
// import { ref } from 'vue';
// import { emitEvent } from './eventBus';
// import { LoginUser } from '/@/service/User';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
// import { useUserStoreWithOut } from '/@/stores/modules/UserConfig';
// import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';

/** 从 useMessage 解构的 Toast / Dialog 能力 */
const { CreateToast, CreateLoadingToast } = useMessage();

// const UserStore = useUserStoreWithOut();

/** 从 useI18n 解构的文案与能力 */
const { t } = useI18n();

// 检测登录

/** ConnectService */
export const ConnectService = () => {
  Web3Connect();
};

// 开始链接

/** 方法：Web3Connect */
const Web3Connect = async () => {
  const Client: any = window;

  // 检测当前是否已安装钱包插件
  if (Client.ethereum) {
    Client.web3 = new Web3(Client.ethereum);
    try {
      // 请求用户授权
      // await Client.ethereum.enable();

      // 获取账户地址
      const Account = await Client.web3.eth.requestAccounts();

      if (Account.length > 0) {
        // 签名文案
        const Message = 'Login ' + new Date().getTime();

        // 请求签名
        Client.web3.eth.personal
          .sign(Message, Account[0], '')
          .then((res: any) => {
            // 签名成功
            if (res) {
              CreateLoadingToast('Loading');
              // 执行登录
              // LoginUser({ wallet_token: Account[0] }).then((res: any) => {
              //   const { code, message, token } = res.data;
              //   if (code === 1) {
              //     // 写入token
              //     UserStore.setToken(token);
              //     // 获取用户信息
              //     // UserStore.setUserInfo();
              //     CreateSuccessToast(message);
              //     // 关闭登录弹窗
              //     emitEvent('OpenLoginModal', false);
              //   } else {
              //     CreateToast(message);
              //   }
              // });
            }
          })
          .catch(() => {
            // 用户拒绝签名
            CreateToast(t('sys.sign'));
          });
      }
    } catch {
      // 用户拒绝授权
      CreateToast(t('sys.auth'));
    }
  } else {
    // 未安装
    Client.web3 = new Web3(new Web3.providers.HttpProvider(location.origin));
    CreateToast(t('sys.uninstall'));
  }
};

// 获取第三方钱包弹窗
// export const ConnectWeb3Modal = async () => {

//   // 定义状态
//   const web3 = ref<Web3 | null>(null);
//   const provider = ref<WalletConnectProvider | null>(null);
//   const account = ref<string | null>(null);

//   try {
//     // 初始化 WalletConnect 提供者
//     provider.value = new WalletConnectProvider({
//       infuraId: 'cef5ea85a13ef31c9a9daf81d4195778', // 替换为你的 Infura 项目 ID
//       qrcodeModalOptions: {
//         mobileLinks: ['metamask', 'trust', 'rainbow'], // 支持的钱包列表
//       },
//     });

//     // 启用会话(弹出 WalletConnect 二维码)
//     await provider.value.enable();

//     // 初始化 Web3 实例
//     web3.value = new Web3(provider.value as any);

//     // 获取账户
//     const accounts = await web3.value.eth.getAccounts();
//     account.value = accounts[0];

//     console.log('Connected account:', account.value);
//   } catch (error) {
//     console.error('Failed to connect wallet:', error);
//   }
// };

// 截取显示钱包地址

/** 显隐控制：WalletVisible */
export const WalletVisible = (wallet: string) => {
  // 截取前5位
  const Prefix = wallet.substring(0, 7);

  return Prefix;
};
