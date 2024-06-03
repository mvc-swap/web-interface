'use strict';
import BaseAPI from './base';
import { isTestNet } from 'common/utils';

class PoolV2 extends BaseAPI {
    _request(api, params = {}, method = 'GET', url = '', catchError) {
        if (isTestNet()) {
            this.baseUrl = 'https://api.mvcswap.com/swapv2/test/';
        } else {
            this.baseUrl = 'https://api.mvcswap.com/swapv2/';
        }

        if (url) this.baseUrl = url;

        let api_url = this.baseUrl + api;
        return this.sendRequest(api_url, params, method, catchError);
    }
    queryUserPositions(address) {
        return this._request('userpositions', { address });
    }
}

export default new PoolV2();