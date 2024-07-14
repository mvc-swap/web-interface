import PageContainer from "../../components/PageContainer"
import { LeftOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { Card, Statistic, Tooltip, Button, message, Row, Col, Tag } from "antd";
import { history, useLocation, useParams } from 'umi'
import { connect } from 'dva';
import { gzip } from 'node-gzip';
import TokenLogo from 'components/tokenicon';
import TokenPair from 'components/tokenPair';
import './index.less'
import PairChart from "../../components/PairChart";
import { useEffect, useMemo, useState, useCallback } from "react";
import api from '../../api/poolv2';
import { formatAmount, formatSat, formatTok } from 'common/utils';
import { priceToSqrtX96, sqrtX96ToPrice } from '../../utils/helper';
import { getTickAtSqrtRatio, getSqrtRatioAtTick } from '../../utils/tickMath';
import { mint } from '../../utils/swapAlgoV3';
import { getMaxLiquidityForAmounts, getAmount0ForLiquidity, getAmount1ForLiquidity, getLiquidityForAmount0, getLiquidityForAmount1 } from '../../utils/liquidityAmounts'



const PositionDetail = ({ user, poolV2, dispatch }) => {
    const { pair: pairName } = useParams();
    console.log(pairName)
    const { isLogin, accountInfo: { userAddress, userBalance } } = user;
    const { icons, curPair } = poolV2;
    console.log(curPair, 'curPair')
    const [position, setPosition] = useState();
    const [loading, setLoading] = useState(true);
    const [precent, setPrecent] = useState(0);
    const [token1, setToken1] = useState(0);
    const [token2, setToken2] = useState(0);
    const getUserPoolV2s = useCallback(async () => {
        if (user && user.isLogin && user.accountInfo && user.accountInfo.userAddress) {
            const res = await api.queryUserPositions(user.accountInfo.userAddress);
            if (res && res.data) {
                let _positions = [];
                for (let pairName in res.data) {
                    const { positions: pairPos, currentPrice, currentTick, feeRate } = res.data[pairName];
                    pairPos.forEach((pos) => {
                        //TODO USDT 
                        const minPrice = (sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickLower))).toFixed(4);
                        const maxPrice = sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickUpper)).toFixed(4);
                        console.log(minPrice, maxPrice)
                        const inRange = pos.tickLower < Number(currentTick) && pos.tickUpper > Number(currentTick);
                        _positions.push({ pairName, currentPrice, currentTick, minPrice, maxPrice, inRange, feeRate, ...pos })
                    })

                }
                const find = _positions.find((pos) => pos.pairName === pairName);
                console.log(find, 'find')
                if (find) {
                    setPosition(find)
                }
            }
            console.log(res)
        }
        setLoading(false)
    }, [user.isLogin])

    useEffect(() => { getUserPoolV2s() }, [getUserPoolV2s])

    const calcAmount = useCallback(async () => {
        if (!position || !curPair) return
        const { tickLower, tickUpper, liquidity: userLiquidity } = position;
        const { tick, sqrtPriceX96, liquidity, token1: { decimal }, token2: { decimal: decimal2 } } = curPair;
        console.log(tick, sqrtPriceX96, liquidity, userLiquidity, 'calcAmount')
        const swapRes = mint(Number(tick), BigInt(sqrtPriceX96), BigInt(liquidity), tickLower, tickUpper, BigInt(userLiquidity));
        setToken1(formatSat(swapRes.amount0, decimal))
        setToken2(formatSat(swapRes.amount1, decimal2))
    }, [position, curPair])

    useEffect(() => {
        calcAmount()
    }, [calcAmount])

    const onRemove = async () => {
        const { tickLower, tickUpper, liquidity: userLiquidity } = position;
        const ret = await api.reqSwapArgs({
            symbol: curPair.pairName,
            address: userAddress,
            op: 2,
            source: 'mvcswap.io'
        });
        if (ret.code !== 0) {
            return;
        }
        console.log(ret, 'ret')
        const { mvcToAddress, tokenToAddress, changeAddress, rabinApis, txFee, requestIndex } = ret.data;
        const tx_res = await window.metaidwallet.transfer({
            broadcast: false,
            tasks: [
                {
                    type: 'space',
                    receivers: [{ address: mvcToAddress, amount: String(txFee) }],
                },

            ],
        })
        console.log(tx_res, 'tx_res')
        if (tx_res.status === 'canceled') throw new Error(tx_res.status)
        if (!tx_res) {
            throw new Error('Transaction failed')
        }
        if (tx_res.msg) {
            throw new Error(tx_res.msg)
        }
        const retData = tx_res.res
        const liq_data = {
            symbol: curPair.pairName,
            requestIndex,
            mvcOutputIndex: 0,
            amountCheckRawTx: "",
            liquidityAmount: position.liquidity,
            mvcRawTx: retData[0].txHex,
            tickLower,
            tickUpper,
        }
        console.log(liq_data, 'liq_data')
        const compressData = await gzip(JSON.stringify(liq_data))
        const last = await api.removeLiq({ data: compressData });
        const { txHex, scriptHex, satoshis, inputIndex } = last.data;
        let sign_res = await dispatch({
            type: 'user/signTx',
            payload: {
                datas: {
                    txHex,
                    scriptHex,
                    satoshis,
                    inputIndex,
                },
            },
        });
        const { publicKey, sig } = sign_res;
        let payload = {
            symbol: curPair.pairName,
            requestIndex,
            pubKey: publicKey,
            sig,
        };
        console.log(payload, 'payload')
        const compressData2 = await gzip(JSON.stringify(payload))
        const res = await api.removeLiq2(payload);
        console.log(res, 'res')
    }

    return <PageContainer>
        <div className="PositionRemovePage">
            <div className="titleWraper">
                <div className="actions" onClick={() => { history.goBack() }}><LeftOutlined style={{ color: '#909399' }} /> Back </div>
                <div className="title">
                    Remove liquidity
                </div>
                <div className="subfix"></div>

            </div>

            {position && poolV2.curPair && <div className="content" style={{ padding: '20px 0' }}>

                <Card style={{ borderRadius: 12 }} className="actionBar">
                    <TokenPair
                        symbol1={pairName.split('-')[0]}
                        genesisID1={pairName.split('-')[0]}
                        url1={icons[pairName.split('-')[0]] || ''}
                        url2={icons[pairName.split('-')[1]] || ''}
                        symbol2={pairName.split('-')[1]}
                        genesisID2={pairName.split('-')[1]}
                        size={32}
                    />

                    {pairName.toUpperCase().replace('-', '/')}
                    {token1} {pairName.split('-')[0]} + {token2} {pairName.split('-')[1]}
                    <Button type="primary" onClick={onRemove} block size='large' style={{ border: 'none', borderRadius: 12, color: '#fff', height: 60, background: 'linear-gradient(93deg, #72F5F6 4%, #171AFF 94%)' }}>Remove liquidity</Button>
                </Card>



            </div>}



        </div>
    </PageContainer>
}

const mapStateToProps = ({ user, poolV2 }) => {
    return {
        user,
        poolV2
    };
};

export default connect(mapStateToProps)(PositionDetail);