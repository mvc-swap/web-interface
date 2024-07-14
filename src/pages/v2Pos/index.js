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
    const [position, setPosition] = useState();
    const [loading, setLoading] = useState(true);
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
    }, [user])

    useEffect(() => { getUserPoolV2s() }, [getUserPoolV2s])

    const collectFee = async () => {

    }

    return <PageContainer>
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
                        <PairChart curPair={poolV2.curPair}>
                            <div className="inputWrap">
                                <div className="label">
                                    high
                                </div>

                            </div>
                            <div className="inputWrap">
                                <div className="label">
                                    low
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

                                    <div className="feeAmount">{'--'} </div>
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

                                    <div className="feeAmount">{'--'} </div>
                                </div>


                            </div>

                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic title="Unclaimed fees" value={112893} />
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
                                    {position.rewardAmount} SPACE  <TokenLogo
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
                                <Button block className="linerLineButton" onClick={collectFee}>Collect Fee</Button>
                            </Col>
                            <Col xs={24} md={8}>
                                <Button block className="linerLineButton">Remove liquidity</Button>
                            </Col>
                            <Col xs={24} md={8}>
                                <Button type="primary" block size='large' style={{ border: 'none', borderRadius: 12, color: '#fff', height: 60, background: 'linear-gradient(93deg, #72F5F6 4%, #171AFF 94%)' }}>Increase liquidity</Button>
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