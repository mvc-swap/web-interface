import PageContainer from "../../components/PageContainer"
import { LeftOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { Card, Divider, Tooltip, Button, message, Spin, Col, Tag } from "antd";
import { history, useLocation, useParams } from 'umi'
import { connect } from 'dva';
import { gzip } from 'node-gzip';
import TokenLogo from 'components/tokenicon';
import TokenPair from 'components/tokenPair';
import Slider from 'components/rate/slider';
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
    const { query } = useLocation();
    const { pair: pairName } = useParams();

    const tickLower = query['tickLower'];
    const tickUpper = query['tickUpper'];
    const { isLogin, accountInfo: { userAddress, userBalance } } = user;
    const { icons, curPair } = poolV2;
    const [position, setPosition] = useState();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [percent, setPercent] = useState(50);
    const [token1, setToken1] = useState(0);
    const [token2, setToken2] = useState(0);
    const getUserPoolV2s = useCallback(async () => {
        if (userAddress) {
            const res = await api.queryUserPositions(userAddress);
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
                const find = _positions.find((pos) => pos.pairName === pairName && pos.tickUpper == Number(tickUpper) && pos.tickLower == Number(tickLower));
                console.log(find, 'find')
                if (find) {
                    setPosition(find)
                } else {
                    setPosition(undefined)
                }
            }
        }
        setLoading(false)
    }, [userAddress, tickLower, tickUpper])

    useEffect(() => { getUserPoolV2s() }, [getUserPoolV2s])
    const removeAmount = useMemo(() => {
        let amount = 0
        if (position && position.liquidity) {
            amount = Math.round(Number(position.liquidity) * percent / 100)
        }
        return amount

    }, [percent, position])

    const calcAmount = useCallback(async () => {
        if (!position || !curPair) return

        if (curPair.pairName !== pairName) return
        const { tickLower, tickUpper, liquidity: userLiquidity } = position;
        const { tick, sqrtPriceX96, token1: { decimal }, token2: { decimal: decimal2 } } = curPair;
        const swapRes = mint(Number(tick), BigInt(sqrtPriceX96), BigInt(userLiquidity), tickLower, tickUpper, BigInt(removeAmount));
        setToken1(formatSat(swapRes.amount0, decimal))
        setToken2(formatSat(swapRes.amount1, decimal2))
    }, [position, curPair, removeAmount, pairName])

    useEffect(() => {
        calcAmount()
    }, [calcAmount])




    const onRemove = async () => {
        setSubmitting(true)
        try {
            if (!removeAmount) throw new Error('Please select remove amount')
            if (!userAddress) throw new Error('Please connect wallet')
            const { tickLower, tickUpper } = position;
            const ret = await api.reqSwapArgs({
                symbol: curPair.pairName,
                address: userAddress,
                op: 2,
                source: 'mvcswap.io'
            });
            if (ret.code !== 0) {
                throw new Error(ret.msg)
            }
            const { mvcToAddress, txFee, requestIndex } = ret.data;
            let tx_res = await dispatch({
                type: 'user/transferAll',
                payload: {
                    datas: [
                        {
                            type: 'mvc',
                            address: mvcToAddress,
                            amount: (BigInt(txFee)).toString(),
                            changeAddress: userAddress,
                            note: 'mvcswap.com(remove liquidity)',
                        },
                    ],
                    noBroadcast: true,
                },
            });
            if (tx_res.msg || tx_res.status == 'canceled') {
                throw new Error(tx_res.msg || 'canceled');
            }
            if (tx_res.list) {
                tx_res = tx_res.list;
            }
            if (!tx_res[0] || !tx_res[0].txHex) {
                throw new Error(_('txs_fail'));
            }
            const liq_data = {
                symbol: curPair.pairName,
                requestIndex,
                mvcOutputIndex: 0,
                amountCheckRawTx: "",
                liquidityAmount: removeAmount,
                mvcRawTx: tx_res[0].txHex,
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
            const res = await api.removeLiq2(payload);
            message.success('Remove success')
            await getUserPoolV2s()
        } catch (e) {
            console.error(e)
            message.error(e.message)
        }
        setSubmitting(false)
    }
    useEffect(() => {
        if (curPair && curPair.pairName !== pairName) {
            console.log(curPair, 'curPair', pairName)
            dispatch({
                type: 'poolV2/fetchPairInfo',
                payload: {
                    pairName
                }
            })
        }
    }, [pairName, dispatch, curPair])

    const Token1Logo = () => {
        return <TokenLogo
            name={pairName.split('-')[0]}
            genesisID={pairName.split('-')[0]}
            url={icons[pairName.split('-')[0]] || ''}
            size={32}
        />
    }
    const Token2Logo = () => {
        return <TokenLogo
            name={pairName.split('-')[1]}
            genesisID={pairName.split('-')[1]}
            url={icons[pairName.split('-')[1]] || ''}
            size={32}
        />
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
            <Spin spinning={loading || !poolV2.curPair}>
                {(position && poolV2.curPair) && <div className="content" style={{ padding: '20px 0' }}>

                    <Card style={{ borderRadius: 12 }} className="actionBar">
                        <div className="pairName">
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
                        </div>

                        <div className="removeAmount">
                            <Slider percent={percent} changeRate={setPercent} />

                        </div>
                        <div className="removeInfo">
                            <div className="item">
                                <div className="label">Pooled {pairName.split('-')[0].toUpperCase()}</div>
                                <div className="value">
                                    {token1}
                                    <Token1Logo />

                                </div>
                            </div>

                            <div className="item">
                                <div className="label">Pooled {pairName.split('-')[1].toUpperCase()}</div>
                                <div className="value">
                                    {token2}
                                    <Token2Logo />

                                </div>
                            </div>
                            <Divider dashed className='divider' />
                            <div className="item">
                                <div className="label">{pairName.split('-')[0].toUpperCase()} Fees Earned</div>
                                <div className="value">
                                    {formatSat(position.token1Fee, poolV2.curPair.token1.decimal)}
                                    <Token1Logo />
                                </div>
                            </div>
                            <div className="item">
                                <div className="label">{pairName.split('-')[1].toUpperCase()} Fees Earned</div>
                                <div className="value">
                                    {formatSat(position.token2Fee, poolV2.curPair.token2.decimal)}
                                    <Token2Logo />
                                </div>
                            </div>

                            <Divider dashed className='divider' />
                            <div className="item">
                                <div className="label">MSP Rewarded</div>
                                <div className="value">
                                    {formatSat(position.rewardAmount)}
                                    <TokenLogo
                                        name={'space'}
                                        url={icons['mvc'] || ''}
                                        size={32}
                                    />
                                </div>
                            </div>


                        </div>


                        <Button type="primary" loading={loading} disabled={!position} onClick={onRemove} block size='large' style={{ marginTop: 20, border: 'none', borderRadius: 12, color: '#fff', height: 60, background: 'linear-gradient(97deg, #72F5F6 4%, #171AFF 94%)' }}>Remove</Button>
                    </Card>




                </div>}
                {!position && !loading && <div style={{ textAlign: 'center', padding: 20 }}>No position found</div>}
            </Spin>



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