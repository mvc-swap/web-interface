
import v2API from '../api/poolv2.js';
import { sleep } from '../common/utils.js';
const iconBaseUrl = 'https://icons.mvcswap.com/resources';
export default {
    namespace: 'poolV2',
    state: {
        pairs: [],
        curPair: undefined,
        icons: {},
    },
    subscriptions: {
       async setup({ dispatch, history }) {
            history.listen((location) => {
                if (location.pathname.indexOf('/v2pool') > -1) {
                    dispatch({
                        type: 'getAllPairs',
                        payload: {
                            type: 'init'
                        }
                    });
                    dispatch({
                        type: 'fetchIcons',
                        payload: {
                            type: 'init'
                        }
                    });
                }
            });
            while (true) {
                await dispatch({
                    type: 'getAllPairs',
                    payload: {
                        type: 'update'
                    }
                });
                await sleep(10000);
            }
        }
    },
    effects: {
        *getAllPairs({ payload = {} }, { call, put, select }) {
            const { pairName, type } = payload;

            if (type === 'init') {
                let _pairs = yield select((state) => state.poolV2.pairs);
                if (_pairs.length > 0) {
                    return
                }
            }

            let ret = yield v2API.queryAllPairs();
            if (ret.code !== 0) {
                console.log(res.msg);
                return res;
            }
            let priceRet = yield v2API.queryTokenPrices();
            let prices = {}
            if (priceRet.code === 0) {
                prices = { ...priceRet.data }
            }
            let _pairs = []
            for (let pairName in ret.data) {

                _pairs.push({
                    pairName, ...ret.data[pairName], token1: {
                        price: prices[ret.data[pairName].token1.symbol] || 0,
                        ...ret.data[pairName].token1,
                    },
                    token2: {
                        price: prices[ret.data[pairName].token2.symbol] || 0,
                        ...ret.data[pairName].token2,
                    }
                })
            }

            let _curPair = yield select((state) => state.poolV2.curPair);
            if (!_curPair && _pairs.length > 0) {
                _curPair = _pairs[0]
            }

            yield put({
                type: 'save',
                payload: {
                    pairs: _pairs,
                },
            });
            yield put({
                type: 'fetchPairInfo',
                payload: {
                    pairName: pairName || _curPair.pairName
                }
            })
            return _pairs;
        },
        *fetchPairInfo({ payload }, { call, put, select }) {
            const { pairName } = payload
            let _pairs = yield select((state) => state.poolV2.pairs);

            const ret = yield v2API.fetchPairInfo(pairName)
            if (ret.code === 0) {
                const find = _pairs.find(
                    (item) => item.pairName === pairName
                )
                if (!find) {
                    yield put({
                        type: 'getAllPairs'
                    })
                    return
                }

                const token1MarketCap = find.token1.price * Number(find.token1Amount) / Math.pow(10, find.token1.decimal);
                const token2MarketCap = find.token2.price * Number(find.token2Amount) / Math.pow(10, find.token2.decimal);
                const pairMarketCap = token1MarketCap + token2MarketCap;
                const token1Precent = token1MarketCap / pairMarketCap * 100;
                const token2Precent = token2MarketCap / pairMarketCap * 100;
                yield put({
                    type: 'save',
                    payload: {
                        curPair: {
                            ...find,
                            ...ret.data,
                            marketCap: pairMarketCap,
                            token1: {
                                marketCap: token1MarketCap,
                                precent: token1Precent,
                                ...find.token1,
                                ...ret.data.token1,
                            },
                            token2: {
                                marketCap: token2MarketCap,
                                precent: token2Precent,
                                ...find.token2,
                                ...ret.data.token2,
                            }
                        }
                    },
                });
            }
        },
        *fetchIcons({ payload }, { call, put, select }) {
            const { type } = payload;
            if (type === 'init') {
                const icons = yield select((state) => state.poolV2.icons);
                if (Object.keys(icons).length > 0) {
                    return
                }
            }
            const ret = yield v2API.queryIcons();
            const _icons = {}
            if (ret.success && ret.data) {
                ret.data.forEach(item => {

                    _icons[item.genesis.toString().toLowerCase()] = `${iconBaseUrl}/${item.logo}`;
                    _icons[item.symbol.toLowerCase()] = `${iconBaseUrl}/${item.logo}`;
                })
                _icons.mvc = _icons.space;
                _icons.MVC = _icons.space;
            }
            yield put({
                type: 'save',
                payload: {
                    icons: _icons
                },
            });
        }
    },
    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
}