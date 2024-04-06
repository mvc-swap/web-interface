'use strict';
import BaseAPI from './base';


class Stats extends BaseAPI {
  _request(api, params = {}, method = 'GET', url = '', catchError) {
    this.baseUrl = 'https://api.mvcswap.com/stats/';
    let api_url = this.baseUrl + api;
    return this.sendRequest(api_url, params, method, catchError);
  }

  queryTokens() {
    return this._request('tokens');
  }

  queryStatInfo(symbol) {
    return this._request('info', { symbol });
  }
}

export default new Stats();
