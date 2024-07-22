import PageContainer from "../../components/PageContainer"
import { LeftOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { Card, Statistic, Tooltip, Button, message, Row, Col, Tag } from "antd";
import { history, useLocation, useParams, useSearchParams } from 'umi'
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
    const { query } = useLocation();
    const { pair: pairName } = useParams();

    const tickLower = query['tickLower'];
    const tickUpper = query['tickUpper'];
    const { isLogin, accountInfo: { userAddress, userBalance } } = user;
    const { icons, curPair } = poolV2;
    const [position, setPosition] = useState();
    const [loading, setLoading] = useState(true);
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
                }
            }
            console.log(res)
        }
        setLoading(false)
    }, [userAddress, tickLower, tickUpper])

    useEffect(() => { getUserPoolV2s() }, [getUserPoolV2s])

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



    const collectFee = async () => {
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
            const { publicKey, sig } = sign_res;
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
        } catch (err) {
            console.error(err);
            message.error(err.message || 'Collect fee failed');
        }

    }

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
                <div className="subfix">{position && position.feeRate || '--'}% Spread Factor</div>

            </div>
            {
                position && <div className="rangeWrap">
                    {!position.inRange ? <Tag bordered={false} color="#FFEED9" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'block', width: 6, height: 6, background: '#FF8F1F', borderRadius: '50%' }}></span> OUT OF RANGE
                    </Tag> : <Tag bordered={false} color="#DEF9F0" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
                                        high:{position.maxPrice}
                                    </div>
                                    <div className="value">
                                        {position.maxPrice}
                                    </div>

                                </div>
                                <div className="inputWrap">
                                    <div className="label">
                                        low
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
                            <Statistic title="Current amount" value={112893} />
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

                                    <div className="feeAmount">{curPair.token1Amount} </div>
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

                                    <div className="feeAmount">{curPair.token2Amount} </div>
                                </div>


                            </div>

                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic title="Unclaimed fees" value={'--'} />
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

                                    <div className="feeAmount">{position.token1Fee} </div>
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

                                    <div className="feeAmount">{position.token2Fee} </div>
                                </div>


                            </div>

                        </Card>
                    </Col>
                    {position && position.rewardAmount && <Col span={24}>
                        <Card style={{ borderRadius: 12 }}>
                            <div className="reward">
                                <div>Reward MSP <Tooltip title="The trading pairs added to the liquidity pool will generate reward benefits after 7 days."><QuestionCircleFilled /></Tooltip></div>
                                <div className="value">
                                    {formatSat(position.rewardAmount)} SPACE  <TokenLogo
                                        name={'space'}
                                        url={icons['mvc'] || ''}
                                        size={32}
                                    />
                                </div>
                            </div>
                        </Card>
                    </Col>}
                    <Col span={24}>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} md={8}>
                                <Button block className="linerLineButton" disabled={!(Number(position.token1Fee) || Number(position.token2Fee))} onClick={collectFee}>Collect Fee</Button>
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