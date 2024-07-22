import PageContainer from "../../components/PageContainer"
import { LeftOutlined } from '@ant-design/icons';
import { Divider, InputNumber, Button, message, Row, Col, Card } from "antd";
import { history, useParams, useLocation } from 'umi'
import { connect } from 'dva';
import { gzip } from 'node-gzip';
import TokenLogo from 'components/tokenicon';
import './index.less'
import PairChart from "../../components/PairChart";
import { useEffect, useMemo, useState } from "react";
import api from '../../api/poolv2';
import { formatAmount, formatSat, formatTok } from 'common/utils';
import { priceToSqrtX96, sqrtX96ToPrice } from '../../utils/helper';
import { getTickAtSqrtRatio, getSqrtRatioAtTick } from '../../utils/tickMath';
import { mint } from '../../utils/swapAlgoV3';
import { getMaxLiquidityForAmounts, getAmount0ForLiquidity, getAmount1ForLiquidity, getLiquidityForAmount0, getLiquidityForAmount1 } from '../../utils/liquidityAmounts'

const TokenWrap = ({ icon, symbol, rate }) => {
    return <div className="tokenWrap">
        <TokenLogo
            name={symbol}
            genesisID={''}
            size={48}
            url={icon}
        />
        <div className="info">
            <div className="symbol">{symbol}</div>
            <div className="rate">{ }%</div>
        </div>
    </div>
}

const TwoPower64 = BigInt(18446744073709551616)

const NewPosition = ({ user, poolV2, dispatch }) => {
    const { query } = useLocation();
    const _tickLower = query['tickLower'];
    const _tickUpper = query['tickUpper'];
    const { isLogin, accountInfo: { userAddress, userBalance } } = user;
    const { icons, curPair, pairs } = poolV2;
    console.log(curPair, 'curPair')

    const { pair: pairName } = useParams();

    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [tickLower, setTickLower] = useState(Number(_tickLower) || 0);
    const [tickUpper, setTickUpper] = useState(Number(_tickUpper) || 0);
    const [token1, setToken1] = useState(0);
    const [token2, setToken2] = useState(0);
    const [liquidityAmount, setLiquidityAmount] = useState(0);

    const handleToken1Change = (value) => {
        if (!(poolV2.curPair && poolV2.curPair.tickSpacing)) return;
        const { sqrtPriceX96, liquidity, tick, token1: { decimal }, token2: { decimal: decimal2 } } = poolV2.curPair
        const sqrtPrice1 = getSqrtRatioAtTick(tickLower)
        const sqrtPrice2 = getSqrtRatioAtTick(tickUpper)
        const liquidityAmount = getMaxLiquidityForAmounts(BigInt(sqrtPriceX96), sqrtPrice1, sqrtPrice2, BigInt(value * 10 ** decimal), TwoPower64)
        const swapRes = mint(Number(tick), BigInt(sqrtPriceX96), BigInt(liquidity), tickLower, tickUpper, liquidityAmount);
        setLiquidityAmount(liquidityAmount)
        console.log(liquidityAmount, swapRes)
        setToken1(formatSat(swapRes.amount0, decimal))
        setToken2(formatSat(swapRes.amount1, decimal2))
    }
    const handleToken2Change = (value) => {
        if (!(poolV2.curPair && poolV2.curPair.tickSpacing)) return;
        const { sqrtPriceX96, liquidity, tick, token1: { decimal }, token2: { decimal: decimal2 } } = poolV2.curPair
        // setToken2(value)
        const sqrtPrice1 = getSqrtRatioAtTick(tickLower)
        const sqrtPrice2 = getSqrtRatioAtTick(tickUpper)
        const liquidityAmount = getMaxLiquidityForAmounts(BigInt(sqrtPriceX96), sqrtPrice1, sqrtPrice2, TwoPower64, BigInt(value * 10 ** decimal2),)
        const swapRes = mint(Number(tick), BigInt(sqrtPriceX96), BigInt(liquidity), tickLower, tickUpper, liquidityAmount);
        setLiquidityAmount(liquidityAmount)
        setToken1(formatSat(swapRes.amount0, decimal))
        setToken2(formatSat(swapRes.amount1, decimal2))
    }

    // useEffect(() => {
    //     const init = async () => {
    //         await dispatch({
    //             type: 'poolV2/getAllPairs',
    //             payload: {}
    //         })
    //     }
    //     init()
    // }, [])

    const calcMinPrice = (_price) => {
        if (!(poolV2.curPair && poolV2.curPair.tickSpacing) || !_price) return;
        const { tickSpacing } = poolV2.curPair;
        const _lowSX96 = priceToSqrtX96(_price);
        let _lowTick = getTickAtSqrtRatio(BigInt(_lowSX96.toFixed(0)));
        _lowTick = Math.floor(_lowTick / tickSpacing) * tickSpacing;
        setTickLower(_lowTick);
        setMinPrice(sqrtX96ToPrice(getSqrtRatioAtTick(_lowTick)));
        handleToken1Change(token1)
    }

    const calcMaxPrice = (_price) => {
        if (!(poolV2.curPair && poolV2.curPair.tickSpacing) || !_price) return;
        const { tickSpacing } = poolV2.curPair;
        const _highSX96 = priceToSqrtX96(_price);
        let _highTick = getTickAtSqrtRatio(BigInt(_highSX96.toFixed(0)));
        _highTick = Math.ceil(_highTick / tickSpacing) * tickSpacing;
        setTickUpper(_highTick);
        setMaxPrice(sqrtX96ToPrice(getSqrtRatioAtTick(_highTick)));
        handleToken1Change(token1)
    }
    useEffect(() => {
        if (!poolV2.curPair) return;
        if (!poolV2.curPair.sqrtPriceX96) return;
        if (_tickLower && _tickUpper) {
            const minPrice = (sqrtX96ToPrice(getSqrtRatioAtTick(_tickLower))).toFixed(4);
            const maxPrice = sqrtX96ToPrice(getSqrtRatioAtTick(_tickUpper)).toFixed(4);
            setTickUpper(_tickUpper);
            setTickLower(_tickLower);
            setMinPrice(minPrice);
            setMaxPrice(maxPrice);
            return
        }
        const { sqrtPriceX96, tickSpacing } = poolV2.curPair;
        const price = sqrtX96ToPrice(
            BigInt(sqrtPriceX96)
        );
        const _lowPrice = Number(price) * 0.9;
        const _highPrice = Number(price) * 1.1;
        const _lowSX96 = priceToSqrtX96(_lowPrice);
        const _highSX96 = priceToSqrtX96(_highPrice);
        let _lowTick = getTickAtSqrtRatio(BigInt(_lowSX96.toFixed(0)));
        let _highTick = getTickAtSqrtRatio(BigInt(_highSX96.toFixed(0)));
        _lowTick = Math.floor(_lowTick / tickSpacing) * tickSpacing;
        _highTick = Math.ceil(_highTick / tickSpacing) * tickSpacing;
        setTickUpper(_highTick);
        setTickLower(_lowTick);
        setMinPrice(sqrtX96ToPrice(getSqrtRatioAtTick(_lowTick)));
        setMaxPrice(sqrtX96ToPrice(getSqrtRatioAtTick(_highTick)));
    }, [poolV2.curPair, _tickLower, _tickUpper])

    const handleCreatePosition = async () => {




        try {
            const { curPair } = poolV2;
            if (!curPair) throw new Error('pair not found');
            if (!poolV2.curPair.sqrtPriceX96) throw new Error('pair not found');
            const { isLogin, accountInfo: { userAddress, userBalance } } = user;
            if (!isLogin || !userAddress) throw new Error('please login');

            const ret = await api.reqSwapArgs({
                symbol: curPair.pairName,
                address: userAddress,
                op: 1,
                source: 'mvcswap.io'
            });
            if (ret.code !== 0) {
                throw new Error(ret.msg)
            }
            const { mvcToAddress, tokenToAddress, changeAddress, rabinApis, txFee, requestIndex } = ret.data;
            const token1AddAmount = formatTok(token1, curPair.token1.decimal)
            const token2AddAmount = formatTok(token2, curPair.token2.decimal)
            let tx_res = await dispatch({
                type: 'user/transferAll',
                payload: {
                    datas: [
                        {
                            type: 'mvc',
                            address: mvcToAddress,
                            amount: (BigInt(token1AddAmount) + BigInt(txFee)).toString(),
                            changeAddress,
                            note: 'mvcswap.com(add liquidity)',
                        },
                        {
                            type: 'sensibleFt',
                            address: tokenToAddress,
                            amount: token2AddAmount.toString(),
                            changeAddress,
                            codehash: curPair.token2.codeHash,
                            genesis: curPair.token2.tokenID,
                            rabinApis,
                            note: 'mvcswap.com(add liquidity)',
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
            if (!tx_res[0] || !tx_res[0].txHex || !tx_res[1] || !tx_res[1].txHex) {
                throw new Error(_('txs_fail'));
            }

            const liq_data = {
                symbol: curPair.pairName,
                requestIndex: requestIndex,
                mvcRawTx: tx_res[0].txHex,
                mvcOutputIndex: 0,
                token2RawTx: tx_res[1].txHex,
                token2OutputIndex: 0,
                token1AddAmount: token1AddAmount.toString(),
                amountCheckRawTx: tx_res[1].routeCheckTxHex,
                liquidityAmount: liquidityAmount.toString(),
                tickLower: tickLower,
                tickUpper: tickUpper,
            };
            console.log(liq_data, 'liq_data')
            const compressData = await gzip(JSON.stringify(liq_data))
            const addLiqRet = await api.addLiq({ data: compressData });
            if (addLiqRet.code !== 0) {
                throw new Error(addLiqRet.msg)
            }
            message.success('Success')
            history.push('/v2pool')
        } catch (error) {
            console.log(error)
            message.error(error.message)
        }

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

    return <PageContainer>
        <div className="newPositionPage">
            <div className="titleWraper">
                <div className="actions" onClick={() => { history.goBack() }}><LeftOutlined style={{ color: '#909399' }} /> Back </div>
                <div className="title"> New Position</div>
                <div className="subfix"></div>
            </div>
            <Divider className="Divider" />
            <div className="FormItemTitle">Price range</div>
            <PairChart curPair={poolV2.curPair} icons={icons} pairs={pairs}>
                {
                    (_tickLower && _tickLower) ? <div className="infoShow">

                        <div className="inputWrap">
                            <div className="label">
                                high:
                            </div>
                            <div className="value">
                                {maxPrice}
                            </div>

                        </div>
                        <div className="inputWrap">
                            <div className="label">
                                low
                            </div>
                            <div className="value">
                                {minPrice}
                            </div>

                        </div>
                    </div> : <div className="editPrice">
                        <div className="inputWrapper">
                            <div className="label">
                                high
                            </div>
                            <InputNumber onBlur={(e) => { calcMaxPrice(e.target.value) }} value={maxPrice} bordered={false} controls={false} style={{ textAlign: 'right' }}></InputNumber>
                        </div>
                        <div className="inputWrapper">
                            <div className="label">
                                low
                            </div>
                            <InputNumber onBlur={(e) => { calcMinPrice(e.target.value) }} value={minPrice} bordered={false} controls={false}></InputNumber>
                        </div>
                    </div>
                }


            </PairChart>
            <div className="FormItemTitle" >Amount to deposit</div>
            <Row gutter={[20, 20]} >
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }} >
                        <div className="tokenCard">
                            <TokenWrap icon={icons[curPair && curPair.token1.genesisHash] || icons[curPair && curPair.token1.symbol]} symbol={curPair && curPair.token1.symbol} rate={poolV2.curPair && poolV2.curPair.token1.rate} />
                            <div className="tokenInputWrap">
                                <div className="bal">{curPair && curPair.token1.symbol === 'space' && userBalance['MVC']}{curPair && curPair.token1.symbol}</div>
                                <InputNumber className="inputNumber" onBlur={(e) => { handleToken1Change(e.target.value) }} value={token1} bordered={false} controls={false} precision={curPair && curPair.token1.decimal}></InputNumber>
                            </div>

                        </div>

                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }}>

                        <div className="tokenCard">
                            <TokenWrap icon={icons[curPair && curPair.token2.genesisHash] || icons[curPair && curPair.token2.symbol]} symbol={curPair && curPair.token2.symbol} rate={poolV2.curPair && poolV2.curPair.token2.rate} />
                            <div className="tokenInputWrap">
                                <div className="bal">{userBalance[curPair && curPair.token2.tokenID]}{curPair && curPair.token2.symbol}</div>
                                <InputNumber className="inputNumber" value={token2} bordered={false} controls={false} onChange={handleToken2Change} precision={curPair && curPair.token2.decimal}></InputNumber>
                            </div>

                        </div>

                    </Card>
                </Col>
            </Row>


            <Button onClick={handleCreatePosition} block size='large' style={{ border: 'none', marginTop: 20, marginBottom: 20, borderRadius: 12, color: '#fff', height: 60, background: 'linear-gradient(93deg, #72F5F6 4%, #171AFF 94%)' }}>Add Liquidity</Button>

        </div>
    </PageContainer>
}

const mapStateToProps = ({ user, poolV2 }) => {
    return {
        user,
        poolV2
    };
};

export default connect(mapStateToProps)(NewPosition);