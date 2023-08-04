'use strict';
import BaseAPI from './base';
import { isTestNet } from 'common/utils';

class Farm extends BaseAPI {
  _request(api, params = {}, method = 'GET', url = '', catchError) {
    if (isTestNet()) {
      //TODO: this.baseUrl = 'https://api.mvcswap.com/farm/test/';
      this.baseUrl = 'http://127.0.0.1:45100/';
    } else {
      this.baseUrl = 'https://api.mvcswap.com/farm/';
      // console.log(TS_ENV)
      if (TS_ENV === 'beta') {
        this.baseUrl = this.baseUrl + 'beta/';
      }
    }

    if (url) this.baseUrl = url;

    let api_url = this.baseUrl + api;
    return this.sendRequest(api_url, params, method, catchError);
  }

  queryAllPairs(address) {
    if (address) {
      return this._request('allpairs', { address });
    }
    return this._request('allpairs');
  }

  querySwapInfo(symbol) {
    return this._request('farminfo', { symbol });
  }

  reqSwap(params) {
    return this._request('reqstakeargs', params, 'POST');
  }

  deposit(params) {
    return this._request('deposit', params, 'POST');
  }

  withdraw(params) {
    return this._request('directwithdraw', params, 'POST');
  }

  withdraw2(params) {
    return this._request('directwithdraw2', params, 'POST');
  }

  harvest(params) {
    return this._request('harvest', params, 'POST');
  }

  harvest2(params) {
    return this._request('harvest2', params, 'POST');
  }

  reqcreatefarm(params) {
    return this._request('reqcreatefarm', params, 'POST');
  }

  createfarm(params) {
    return this._request('createfarm', params, 'POST');
  }
}

export default new Farm();
