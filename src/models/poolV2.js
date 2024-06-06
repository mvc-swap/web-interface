import v2API from '../api/poolv2.js';
export default {
    namespace: 'poolV2',
    state: {
        pairs: [],
        curPair: undefined
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
    },
    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
}