'use strict';
import BaseAPI from './base';
import { isTestNet } from 'common/utils';

class History extends BaseAPI {
  _request(api, params = {}, method = 'GET', url = '', catchError) {
    if (isTestNet()) {
      this.baseUrl = 'https://api.sensiblequery.com/test/contract/';
    } else {
      this.baseUrl = 'https://api.sensible.satoplay.cn/contract/';
    }

    if (url) this.baseUrl = url;

    let api_url = this.baseUrl + api;
    return this.sendRequest(api_url, params, method, catchError);
  }

  query(params) {
    const { codeHash, genesisHash, type } = params;
    if (type === 'pool') {
      return this._request(`swap-data/${codeHash}/${genesisHash}`, {
        start: 690000,
        size: 100,
      });
    } else {
      return this._request(`swap-aggregate/${codeHash}/${genesisHash}`, {
        start: 690000,
        interval: 100,
      });
    }
  }
  // querySwapData(params) {
  //   const { codeHash, genesisHash } = params;
  //   return this._request(`swap-aggregate/${codeHash}/${genesisHash}`, { start: 690000, interval: 100});

  // }

  // queryAmountData(params) {
  //   const { codeHash, genesisHash } = params;
  //   return this._request(`swap-data/${codeHash}/${genesisHash}`, { start: 690000, size: 100});

  // }
}

export default new History();
