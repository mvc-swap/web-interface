import React, { useCallback, useEffect } from 'react';
import Notice from 'components/notice';
import { Tag, Spin, Card, Button } from "antd";
import {
    FileTextOutlined
} from '@ant-design/icons';
import { PlusCircleFilled } from '@ant-design/icons';
import Layout from '../layout';
import Header from '../layout/header';
import './index.less'
import { connect } from 'dva';
import { history } from 'umi'
import api from '../../api/poolv2';
import TokenPair from 'components/tokenPair';
import { sqrtX96ToPrice } from '../../utils/helper';
import { getSqrtRatioAtTick } from '../../utils/tickMath';
import { formatSat } from 'common/utils';
import arrow from '../../assets/arrow.svg'
import { isUSDT } from '../../common/utils';
const PositionCard = ({ pairName, displayPairName, feeRate, inRange, minPrice, maxPrice, tickLower, tickUpper, icons }) => (
    <div className="position-card" onClick={() => { history.push(`/v2pool/pos/${pairName}?tickLower=${tickLower}&tickUpper=${tickUpper}`) }}>
        <div className='cardLeft'>
            <TokenPair
                symbol1={pairName.split('-')[0]}
                genesisID1={pairName.split('-')[0]}
                url1={icons[pairName.split('-')[0]] || ''}
                url2={icons[pairName.split('-')[1]] || ''}
                symbol2={pairName.split('-')[1]}
                genesisID2={pairName.split('-')[1]}
                size={48}
            />
            <div className='info'>
                <div className='titleWrap'>
                    <div className='pairName'>{displayPairName}</div>
                    <div className='feeRate'>{feeRate}% Spread Factor</div>
                </div>
                <div>
                    {!inRange ? <Tag color="#FFEED9" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'block', width: 6, height: 6, background: '#FF8F1F', borderRadius: '50%' }}></span> OUT OF RANGE
                    </Tag> : <Tag color="#DEF9F0" style={{ color: '#303133', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'block', width: 6, height: 6, background: '#00B578', borderRadius: '50%' }}></span> IN RANGE
                    </Tag>}
                </div>


            </div>
        </div>
        <div className='cardRight'>
            <div className='label'>Selected Range</div>
            <div className='range'>{minPrice} <img src={arrow} /> {maxPrice}</div>
        </div>
    </div>
);
const PoolV2 = ({ user, poolV2, dispatch }) => {
    const { pairs, icons, curPair } = poolV2
    const [positions, setPositions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const { isLogin, accountInfo: { userAddress, userBalance } } = user;
    const getUserPoolV2s = useCallback(async () => {
        if (userAddress && pairs.length > 0) {
            const res = await api.queryUserPositions(userAddress);
            if (res && res.data) {
                let _positions = [];
                for (let pairName in res.data) {
                    const { positions: pairPos, currentPrice, currentTick, feeRate } = res.data[pairName];
                    const pair = pairs.find(pair => pair.pairName === pairName);
                    const isUSDTPair = pair && isUSDT(pair.token1.genesisTxid, pair.token2.genesisTxid)
                    pairPos.forEach((pos) => {

                        let minPrice = (sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickLower))).toFixed(4);
                        let maxPrice = sqrtX96ToPrice(getSqrtRatioAtTick(pos.tickUpper)).toFixed(4);
                        if (!isUSDTPair) {
                            let tmp = Number(minPrice)
                            minPrice = (1 / Number(maxPrice)).toFixed(4);
                            maxPrice = (1 / Number(tmp)).toFixed(4);
                        }
                        const parts = pairName.toUpperCase().replace('-', '/').split('/');
                        let displayPairName = `${parts[1]}/${parts[0]}`
                        if (isUSDTPair) {
                            displayPairName = `${parts[0]}/${parts[1]}`
                        }
                        const inRange = pos.tickLower < Number(currentTick) && pos.tickUpper > Number(currentTick);
                        _positions.push({ pairName, currentPrice, currentTick, minPrice, maxPrice, inRange, displayPairName, feeRate, ...pos })
                    })

                }
                setPositions(_positions);
            }
        } else {
            setPositions([])
        }
        setLoading(false)
    }, [userAddress, pairs])

    const [rewardingPool, setRewardingPool] = React.useState([]);

    useEffect(() => { getUserPoolV2s() },
        [getUserPoolV2s])

    useEffect(() => {
        const now = new Date().getTime() / 1000;
        if (pairs) {
            const _rewardingPool = pairs.filter(pair => {
                return pair.reward.rewardStartTime < now && now < pair.reward.rewardEndTime && pair.reward.rewardAmountPerSecond > 0
            })

            setRewardingPool(_rewardingPool.map(item => {
                const parts = item.pairName.toUpperCase().replace('-', '/').split('/');
                let displayPairName = `${parts[1]}/${parts[0]}`
                if (isUSDT(item.token1.genesisTxid, item.token2.genesisTxid)) {
                    displayPairName = `${parts[0]}/${parts[1]}`
                }
                return { ...item, displayPairName }
            }))
        }
    }, [pairs])
    useEffect(() => {
        dispatch({
            type: 'getAllPairs',
            payload: {
                type: 'init'
            }
        });
    }, [isLogin])

    return (
        <Layout>
            <Notice />
            <div className='poolV2container' >
                <Header />
                <div className='wrap'>
                    <div className="positionContainer">
                        <div className="leftPosition">Your Positions</div>
                        <Button type='link' style={{ color: curPair ? '#1e2bff' : 'rgba(0, 0, 0, 0.25)' }} disabled={!curPair} icon={<PlusCircleFilled style={{ color: curPair ? '#1e2bff' : 'rgba(0, 0, 0, 0.25)' }} />} onClick={() => { curPair && history.push(`/v2pool/add/${curPair.pairName}`) }}> New Position</Button>
                    </div>
                    <Spin spinning={loading}>
                        <div className="positions-list">
                            {positions.map((position, index) => (
                                <PositionCard key={String(position.tickLower) + String(position.tickUpper) + position.pairName} index={index} icons={icons} {...position} />
                            ))}
                            {!loading && positions.length > 0 && <div className="no-more">No More</div>}

                        </div>
                        {!loading && positions.length === 0 && <div className="nothing-here">
                            <div className="nothing-here-icon"><FileTextOutlined style={{ color: '#EDEFF2' }} /></div>
                            <div className="nothing-here-text" style={{ color: '#BFC2CC' }}>Nothing Here...</div>
                        </div>}
                    </Spin>

                </div>
                {rewardingPool.length > 0 && <div className='wrap'>
                    <div className="positionContainer">
                        <div className="leftPosition">Rewarding Pool</div>


                    </div>
                    <div>
                        <div className="positions-list">
                            {rewardingPool.map((pool, index) => (
                                <Card key={pool.pairName} style={{ borderRadius: 12 }} onClick={() => { history.push(`/v2pool/add/${pool.pairName}`) }}>
                                    <div className='poolCard'>


                                        <div className="title">
                                            <TokenPair
                                                symbol1={pool.pairName.split('-')[0]}
                                                genesisID1={pool.pairName.split('-')[0]}
                                                url1={icons[pool.pairName.split('-')[0]] || ''}
                                                url2={icons[pool.pairName.split('-')[1]] || ''}
                                                symbol2={pool.pairName.split('-')[1]}
                                                genesisID2={pool.pairName.split('-')[1]}
                                                size={48}
                                            />
                                            <div className='titleWrap'>
                                                <div className='pairName'>{pool.displayPairName}</div>
                                                <div className='feeRate'>{pool.feeRate}% Spread Factor</div>
                                            </div>



                                        </div>
                                        <div className='rewardInfo'>

                                            <div className='rewardInfoItem'>
                                                <div className='label'>Start Time</div>
                                                <div className='value'>{new Date(pool.reward.rewardStartTime * 1000).toLocaleString()}</div>
                                            </div>
                                            <div className='rewardInfoItem'>
                                                <div className='label'>End Time</div>
                                                <div className='value'>{new Date(pool.reward.rewardEndTime * 1000).toLocaleString()}</div>
                                            </div>
                                            <div className='rewardInfoItem'>
                                                <div className='label'>Rewad Per Day</div>
                                                <div className='value'>{formatSat(Number(pool.reward.rewardAmountPerSecond) * 86400, pool.reward.token.decimal)} </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>}
            </div>
        </Layout>
    );
};

const mapStateToProps = ({ user, poolV2 }) => {
    return {
        user,
        poolV2
    };
};

export default connect(mapStateToProps)(PoolV2);
