import { formatSat, strAbbreviation } from 'common/utils';
import _ from 'i18n';
// import 'common/vconsole';

function checkExtension() {
  if (!window.metaidwallet) {
    if (confirm(_('download_metalet'))) {
      window.open('https://metalet.com/');
    }
    return false;
  }
  return true;
}

const getMvcBalance = async () => {
  const res = await window.metaidwallet.getBalance();
  return formatSat(res.balance.total);
};

const getTokenBalance = async () => {
  const res = await window.metaidwallet.token.getBalance();
  // console.log('getSensibleFtBalance:',res);
  const userBalance = {};
  res.forEach((item) => {
    userBalance[item.genesis] = formatSat(item.balance, item.decimal);
  });
  return userBalance;
};

export default {
  info: async () => {
    if (checkExtension()) {
      let accountInfo = {};
      const mvcBalance = await getMvcBalance();

      const userAddress = await window.metaidwallet.getAddress();
      const tokenBalance = await getTokenBalance();
      // const network = await mvc.getNetwork();
      const network = 'mainnet';

      const userBalance = {
        MVC: mvcBalance,
        ...tokenBalance,
      };
      accountInfo = {
        ...accountInfo,
        userBalance,
        userAddress,
        userAddressShort: strAbbreviation(userAddress, [7, 7]),
        network,
      };
      //   console.log('accountInfo:', accountInfo);
      return accountInfo;
    }
  },

  connectAccount: () => {
    if (checkExtension()) {
      return window.metaidwallet.connect({});
    }
  },

  exitAccount: () => {
    return window.metaidwallet.disconnect();
  },

  transferMvc: async (params) => {
    if (checkExtension()) {
      const { address, amount, noBroadcast } = params;

      const res = await window.metaidwallet.transferMvc({
        broadcast: !noBroadcast,
        receivers: [{ address, amount }],
      });
      // console.log(res);
      return res;
    }
  },

  transferAll: async (params) => {
    if (checkExtension()) {
      let data = [];
      const { datas, noBroadcast } = params;
      datas.forEach((item) => {
        const { address, amount, codehash, genesis } = item;
        if (item.type === 'mvc') {
          data.push({
            type: 'space',
            broadcast: !noBroadcast,
            receivers: [{ address, amount }],
          });
        } else if (item.type === 'sensibleFt') {
          data.push({
            type: 'token',
            broadcast: !noBroadcast,
            codehash,
            genesis,
            receivers: [{ address, amount }],
          });
        }
      });

      const res = await window.metaidwallet.transferAll(data);
      return res;
    }
  },

  signTx: async (params) => {
    const res = await window.metaidwallet.signTransactions({ list: [params] });
    // console.log(res); debugger
    return res.sigList[0];
  },
};
