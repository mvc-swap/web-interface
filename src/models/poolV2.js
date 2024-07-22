
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
                },
            });
            console.log('ddddddd')
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
                yield put({
                    type: 'save',
                    payload: {
                        curPair: { ...find, ...ret.data, }
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