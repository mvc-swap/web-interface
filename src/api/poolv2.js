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
    queryAllPairs() {
        return this._request('allpairs', {});
    }
    async queryIcons() {
        return (await fetch('https://icons.mvcswap.com/resources/icons.json')).json();
    }
    fetchPairInfo(symbol) {
        return this._request('swapinfo', { symbol });
    }
    fetchLiquidity(symbol) {
        return this._request('liquidity', { symbol });
    }
    reqSwapArgs(params) {
        return this._request('reqswapargs', params, 'POST');
    }
    addLiq(params) {
        return this._request('addliq', params, 'POST');
    }
}

export default new PoolV2();