import stats from '../api/stats';
export default {
    namespace: 'stats',
    state:{
        tokens:[],
        curInfo:{}
    },
    effects:{
        *getTokens({ payload }, { call, put, select }) {

        },
        *getStatInfo({ payload }, { call, put, select }) {

        }
    },
    reducers: {
        save(state, action) {
          return { ...state, ...action.payload };
        },
      },
}