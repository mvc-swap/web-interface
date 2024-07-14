
import v2API from '../api/poolv2.js';
const iconBaseUrl = 'https://icons.mvcswap.com/resources';
export default {
    namespace: 'poolV2',
    state: {
        pairs: [],
        curPair: undefined,
        icons: {}
    },
    subscriptions: {
        setup({ dispatch, history }) {
            history.listen((location) => {
                console.log(location, 'location')
                if (location.pathname.indexOf('/poolv2') > -1||location.pathname.indexOf('/v2pos') > -1) {
                    dispatch({
                        type: 'getAllPairs',
                    });
                    dispatch({
                        type: 'fetchIcons',
                    });
                }
            });
        }
    },
    effects: {
        *getAllPairs({ payload }, { call, put, select }) {
            let ret = yield v2API.queryAllPairs();
            console.log(ret, 'res')

            if (ret.code !== 0) {
                console.log(res.msg);
                return res;
            }
            let _pairs = []
            for (let pairName in ret.data) {
                _pairs.push({ pairName, ...ret.data[pairName] })
            }
            let _curPair = yield select((state) => state.poolV2.curPair);
            if (!_curPair && _pairs.length > 0) {
                _curPair = _pairs[0]
            }

            yield put({
                type: 'save',
                payload: {
                    pairs: _pairs,
                    curPair: _curPair
                },
            });
            yield put({
                type: 'fetchPairInfo',
            })
            return _pairs;
        },
        *fetchPairInfo({ payload }, { call, put, select }) {
            let _curPair = yield select((state) => state.poolV2.curPair);
            let _pairs = yield select((state) => state.poolV2.pairs);
            console.log(_curPair, 'curPair')
            if (!_curPair) return

            const ret = yield v2API.fetchPairInfo(_curPair.pairName)
            if (ret.code === 0) {
                if (_curPair.token2.tokenID !== ret.data.token2.tokenID || _curPair.token1.tokenID !== ret.data.token1.tokenID) return;
                const find = _pairs.find(
                    (item) => item.token2.tokenID === _curPair.token2.tokenID && item.token1.tokenID === _curPair.token1.tokenID
                )
                const _old = find ? find : _curPair
                yield put({
                    type: 'save',
                    payload: {
                        curPair: { ..._old, ...ret.data, }
                    },
                });
            }
        },
        *fetchIcons({ payload }, { call, put }) {
            const ret = yield v2API.queryIcons();
            console.log(ret, 'icons')
            const _icons = {}
            if (ret.success && ret.data) {
                ret.data.forEach(item => {
                    console.log(item,item.genesis.toString().toLowerCase(), 'item')
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