import PageContainer from "../../components/PageContainer"
import { LeftOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { Card, Statistic, Tooltip, Button, message, Row, Col, Tag, Empty } from "antd";
import { history, useLocation, useParams, useSearchParams } from 'umi'
import { connect } from 'dva';
import { gzip } from 'node-gzip';
import TokenLogo from 'components/tokenicon';
import TokenPair from 'components/tokenPair';
import NumberFormat from 'components/NumberFormat';
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
    const [submiting, setSubmiting] = useState(false);
    const getUserPoolV2s = useCallback(async () => {
        if (userAddress) {
            const res = await api.queryUserPositions(userAddress);
            if (res && res.data) {
                let _positions = [];
                for (let pairName in res.data) {
                    const { positions: pairPos, currentPrice, currentTick, feeRate } = res.data[pairName];
                    pairPos.forEach((pos) => {
                        //TODO USDT 
                        let minPrice = (sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickLower))).toFixed(4);
                        let maxPrice = sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickUpper)).toFixed(4);
                        if(pairName === 'space-usdt'){
                            minPrice=(1/Number(minPrice)).toFixed(4);
                            maxPrice=(1/Number(maxPrice)).toFixed(4);
                        }
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
            console.log(res)
        } else {
            setPosition(undefined)
        }
        setLoading(false)
    }, [userAddress, tickLower, tickUpper])

    useEffect(() => { getUserPoolV2s() }, [getUserPoolV2s])

    useEffect(() => {
        if (curPair && curPair.pairName !== pairName) {
           
            dispatch({
                type: 'poolV2/fetchPairInfo',
                payload: {
                    pairName
                }
            })
        }
    }, [pairName, dispatch, curPair])



    const collectFee = async () => {
        setSubmiting(true);
        try {
            const ret = await api.reqSwapArgs({
                symbol: curPair.pairName,
                address: userAddress,
                op: 2,
                source: 'mvcswap.io'
            });
            if (ret.code !== 0) {
                throw new Error(ret.msg);
            }
            const { mvcToAddress, tokenToAddress, changeAddress, rabinApis, txFee, requestIndex } = ret.data;
            let tx_res = await dispatch({
                type: 'user/transferAll',
                payload: {
                    datas: [
                        {
                            type: 'mvc',
                            address: mvcToAddress,
                            amount: (BigInt(txFee)).toString(),
                            changeAddress,
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
                liquidityAmount: 0,
                mvcRawTx: tx_res[0].txHex,
                tickLower: position.tickLower,
                tickUpper: position.tickUpper,
            }
            console.log(liq_data, 'liq_data')
            const compressData = await gzip(JSON.stringify(liq_data))
            const remove1 = await api.removeLiq({ data: compressData });
            if (remove1.code !== 0) {
                throw new Error(remove1.msg);
            }
            const { txHex, scriptHex, satoshis, inputIndex } = remove1.data;
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
            const { publicKey, sig, msg } = sign_res;
            if (msg) {
                throw new Error(msg)
            }
            let payload = {
                symbol: curPair.pairName,
                requestIndex,
                pubKey: publicKey,
                sig,
            };
            console.log(payload, 'payload')

            const remove2 = await api.removeLiq2(payload);
            if (remove2.code !== 0) {
                throw new Error(remove2.msg);
            }
            console.log(remove2, 'remove2');
            message.success('Collect fee success');
            setLoading(true);
            await getUserPoolV2s();
        } catch (err) {
            console.error(err);
            message.error(err.message || 'Collect fee failed');
        }
        setSubmiting(false);

    }

    const UnclaimedFee = useMemo(() => {
        if (!position) {
            return {
                feeUsd: 0,
                token1Fee: 0,
                token2Fee: 0,
                token1Precent: 0,
                token2Precent: 0
            }
        } else {
            const token1FeeAmount = formatSat(position.token1Fee, curPair.token1.decimal)
            const token2FeeAmount = formatSat(position.token2Fee, curPair.token2.decimal)
            const token1Fee = Number(token1FeeAmount) * curPair.token1.price;
            const token2Fee = Number(token2FeeAmount) * curPair.token2.price;
            const totalFee = token1Fee + token2Fee;
            if (totalFee === 0) {
                return {
                    token1Fee: token1FeeAmount,
                    token2Fee: token2FeeAmount,
                    token1Precent: 0,
                    token2Precent: 0,
                    feeUsd: 0
                }
            }
            const token1Precent = (token1Fee / totalFee) * 100;
            const token2Precent = (token2Fee / totalFee) * 100;
            return {
                token1Fee: position.token1Fee,
                token2Fee: position.token2Fee,
                token1Precent,
                token2Precent,
                feeUsd: totalFee
            }
        }
    }, [position, curPair])

    const CurrentAmount = useMemo(() => {
        if (!curPair||!position) {
            return {
                feeUsd: 0,
                token1Fee: 0,
                token2Fee: 0,
                token1Precent: 0,
                token2Precent: 0
            }
        } else {
            const token1FeeAmount = formatSat(position.token1Amount, curPair.token1.decimal)
            const token2FeeAmount = formatSat(position.token2Amount, curPair.token2.decimal)
            const token1Fee = Number(token1FeeAmount) * curPair.token1.price;
            const token2Fee = Number(token2FeeAmount) * curPair.token2.price;
            const totalFee = token1Fee + token2Fee;
            if (totalFee === 0) {
                return {
                    token1Fee: token1FeeAmount,
                    token2Fee: token2FeeAmount,
                    token1Precent: 0,
                    token2Precent: 0,
                    feeUsd: 0
                }
            }
            const token1Precent = (token1Fee / totalFee) * 100;
            const token2Precent = (token2Fee / totalFee) * 100;
            return {
                token1Fee: position.token1Amount,
                token2Fee: position.token2Amount,
                token1Precent,
                token2Precent,
                feeUsd: totalFee
            }
        }
    }, [position,curPair])

    return <PageContainer spining={loading}>
        <div className="PositionDetailPage">
            <div className="titleWraper">
                <div className="actions" onClick={() => { history.goBack() }}><LeftOutlined style={{ color: '#909399' }} /> Back </div>
                <div className="title">
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
                <div className="subfix">{position ? position.feeRate + '% Spread Factor' : ''}</div>


            </div>
            {
                position && <div className="rangeWrap">
                    {!position.inRange ? <Tag  color="#FFEED9" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'block', width: 6, height: 6, background: '#FF8F1F', borderRadius: '50%' }}></span> OUT OF RANGE
                    </Tag> : <Tag  color="#DEF9F0" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'block', width: 6, height: 6, background: '#00B578', borderRadius: '50%' }}></span> IN RANGE
                    </Tag>}
                </div>
            }
            {position && poolV2.curPair && <div className="content" style={{ padding: '20px 0' }}>
                <Row gutter={[20, 20]}>
                    <Col span={24}>
                        <PairChart curPair={poolV2.curPair} tickLower={position.tickLower} tickUpper={position.tickUpper}>
                            <div className="infoShow">

                                <div className="inputWrap">
                                    <div className="label">
                                        Max price
                                    </div>
                                    <div className="value">
                                        {position.maxPrice}
                                    </div>

                                </div>
                                <div className="inputWrap">
                                    <div className="label">
                                        Min price
                                    </div>
                                    <div className="value">
                                        {position.minPrice}
                                    </div>

                                </div>
                            </div>

                        </PairChart>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic title="Current amount" value={CurrentAmount.feeUsd} precision={2} prefix='$' />
                            <div className="feeWrap">
                                <div className="item">
                                    <div className="token">
                                        <TokenLogo
                                            name={pairName.split('-')[0]}
                                            genesisID={pairName.split('-')[0]}
                                            url={icons[pairName.split('-')[0]] || ''}
                                            size={32}
                                        />
                                        <div>{pairName.split('-')[0].toUpperCase()}</div>
                                    </div>

                                    <div className="feeAmountWrap">
                                        <div className="feeAmount">
                                            <NumberFormat value={CurrentAmount.token1Fee} isBig decimal={curPair.token1.decimal} />
                                        </div>
                                        <div className="feeRate">
                                            <NumberFormat precision={2} value={CurrentAmount.token1Precent} suffix="%" />
                                        </div>
                                    </div>

                                </div>
                                <div className="item">
                                    <div className="token">
                                        <TokenLogo
                                            name={pairName.split('-')[1]}
                                            genesisID={pairName.split('-')[1]}
                                            url={icons[pairName.split('-')[1]] || ''}
                                            size={32}
                                        />
                                        <div>{pairName.split('-')[1].toUpperCase()}</div>
                                    </div>

                                    <div className="feeAmountWrap">
                                        <div className="feeAmount">
                                            <NumberFormat value={CurrentAmount.token2Fee} isBig decimal={curPair.token2.decimal} />
                                        </div>
                                        <div className="feeRate">
                                            <NumberFormat precision={2} value={CurrentAmount.token2Precent} suffix="%" />
                                        </div>
                                    </div>
                                </div>


                            </div>

                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic title="Unclaimed fees" prefix='$' value={UnclaimedFee.feeUsd} precision={2} />
                            <div className="feeWrap">
                                <div className="item">
                                    <div className="token">
                                        <TokenLogo
                                            name={pairName.split('-')[0]}
                                            genesisID={pairName.split('-')[0]}
                                            url={icons[pairName.split('-')[0]] || ''}
                                            size={32}
                                        />
                                        <div>{pairName.split('-')[0].toUpperCase()}</div>
                                    </div>

                                    <div className="feeAmountWrap">
                                        <div className="feeAmount">
                                            <NumberFormat value={UnclaimedFee.token1Fee} isBig decimal={curPair.token1.decimal} />
                                        </div>
                                        <div className="feeRate">
                                            <NumberFormat precision={2} value={UnclaimedFee.token1Precent} suffix="%" />
                                        </div>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="token">
                                        <TokenLogo
                                            name={pairName.split('-')[1]}
                                            genesisID={pairName.split('-')[1]}
                                            url={icons[pairName.split('-')[1]] || ''}
                                            size={32}
                                        />
                                        <div>{pairName.split('-')[1].toUpperCase()}</div>
                                    </div>

                                    <div className="feeAmountWrap">
                                        <div className="feeAmount">
                                            <NumberFormat value={UnclaimedFee.token2Fee} isBig decimal={curPair.token2.decimal} />
                                        </div>
                                        <div className="feeRate">
                                            <NumberFormat precision={2} value={UnclaimedFee.token2Precent} suffix="%" />
                                        </div>
                                    </div>
                                </div>


                            </div>

                        </Card>
                    </Col>
                    {curPair&&position && position.rewardAmount && <Col span={24}>
                        <Card style={{ borderRadius: 12 }}>
                            <div className="reward">
                                <div>Reward  <Tooltip title="The trading pairs added to the liquidity pool will generate reward benefits after 7 days."><QuestionCircleFilled /></Tooltip></div>
                                <div className="value">
                                    {formatSat(position.rewardAmount,curPair.reward.token.decimal)} {curPair.reward.token.symbol.toUpperCase()}  <TokenLogo
                                        name={curPair.reward.token.symbol}
                                        url={icons[curPair.reward.token.symbol] || ''}
                                        size={32}
                                    />
                                </div>
                            </div>
                        </Card>
                    </Col>}
                    <Col span={24}>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} md={8}>
                                <Button loading={submiting} block className="linerLineButton" disabled={!(Number(position.token1Fee) || Number(position.token2Fee))} onClick={collectFee}>Collect Fee</Button>
                            </Col>
                            <Col xs={24} md={8}>
                                <Button block disabled={!(Number(position.liquidity))} className="linerLineButton" onClick={() => { history.push(`/v2pool/remove/${pairName}?tickLower=${position.tickLower}&tickUpper=${position.tickUpper}`) }}>Remove liquidity</Button>
                            </Col>
                            <Col xs={24} md={8}>
                                <Button type="primary" onClick={() => { history.push(`/v2pool/add/${pairName}?tickLower=${position.tickLower}&tickUpper=${position.tickUpper}`) }} block size='large' style={{ border: 'none', borderRadius: 12, color: '#fff', height: 60, background: 'linear-gradient(93deg, #72F5F6 4%, #171AFF 94%)' }}>Increase liquidity</Button>
                            </Col>
                        </Row>
                    </Col>

                </Row>
            </div>}
            {!loading && !position && <Empty style={{ marginTop: 20, color: 'rgb(191, 194, 204)' }} description="Nothing Here..." >
                <Button type="primary" onClick={()=>{ history.push(`/v2pool/add/${pairName}`)}} style={{ border: 'none', borderRadius: 8, color: '#fff', background: 'linear-gradient(102deg, #72F5F6 4%, #171AFF 94%)' }}> New Position</Button>
            </Empty>}



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