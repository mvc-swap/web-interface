import { formatSat, strAbbreviation } from 'common/utils';
import _ from 'i18n';
// import 'common/vconsole';

const mvc = window.sensilet;

function checkExtension() {
  if (!window.sensilet) {
    if (confirm(_('download_sensilet'))) {
      window.open('https://sensilet.com/');
    }
    return false;
  }
  return true;
}

const getMvcBalance = async () => {
  const res = await window.sensilet.getMvcBalance();
  return formatSat(res.balance.total);
};

const getSensibleFtBalance = async () => {
  const res = await window.sensilet.getSensibleFtBalance();
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

      const userAddress = await window.sensilet.getAccount();
      const tokenBalance = await getSensibleFtBalance();
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
      return window.metalet.requestAccount({});
    }
  },

  exitAccount: () => {
    return window.sensilet.exitAccount();
  },

  transferMvc: async (params) => {
    if (checkExtension()) {
      const { address, amount, noBroadcast } = params;

      const res = await window.sensilet.transferMvc({
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
        const { address, amount, codehash, genesis, rabinApis } = item;
        if (item.type === 'mvc') {
          data.push({
            broadcast: !noBroadcast,
            receivers: [{ address, amount }],
          });
        } else if (item.type === 'sensibleFt') {
          data.push({
            broadcast: !noBroadcast,
            codehash,
            genesis,
            receivers: [{ address, amount }],
            rabinApis,
          });
        }
      });

      const res = await window.sensilet.transferAll(data);
      return res;
    }
  },

  signTx: async (params) => {
    const res = await window.sensilet.signTx({ list: [params] });
    // console.log(res); debugger
    return res.sigList[0];
  },
};
