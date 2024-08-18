import { Card, Row, Col, Popover } from 'antd'
import { useRef, useEffect, useState, useMemo } from 'react';
import TokenPair from 'components/tokenPair';
import BarChart from './barChart';
import TradingView from './tradview';
import { DownOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import _ from 'i18n';
import TokenList from 'components/tokenList/poolv2';
import { priceToSqrtX96, sqrtX96ToPrice } from '../../utils/helper';
import { getTickAtSqrtRatio, getSqrtRatioAtTick } from '../../utils/tickMath';
import { isUSDT } from 'common/utils';
import './index.less'
export default ({ children, curPair, icons = {}, pairs = [], tickLower, tickUpper }) => {
    const [open, setOpen] = useState(false)
    const [chartWidth, setChartWidth] = useState(973);
    const chartWrapRef = useRef(null);

    useEffect(() => {
        const resizeChart = () => {
            setTimeout(() => {
                if (chartWrapRef.current) setChartWidth(chartWrapRef.current?.clientWidth || 0)
            }, 400)
        }
        resizeChart()
        window.addEventListener('resize', resizeChart)
        return () => window.removeEventListener('resize', resizeChart)
    }, [])
    const priceTicker = useMemo(() => {
        if (curPair) {
            const { sqrtPriceX96, tickSpacing } = curPair;
            const price = sqrtX96ToPrice(
                BigInt(sqrtPriceX96)
            );
            const _priceSX96 = priceToSqrtX96(Number(price));
            let _priceTick = getTickAtSqrtRatio(BigInt(_priceSX96.toFixed(0)));
            _priceTick = Math.floor(_priceTick / tickSpacing) * tickSpacing;
            return _priceTick
        }
    }, [curPair])
    const isUSDTPair = useMemo(() => {
        if (!curPair) return false;
        return isUSDT(curPair.token1.genesisTxid, curPair.token2.genesisTxid)
    }, [curPair])
    const displayPairName = useMemo(() => {
        if (!curPair) return '';
        const pairName = curPair.pairName.toUpperCase().replace('-', '/')
        const parts = pairName.split('/');
        if (isUSDTPair) {
            return `${parts[0]}/${parts[1]}`
        }
        return `${parts[1]}/${parts[0]}`
    }, [curPair, isUSDTPair])
    if (!curPair) return <></>
    return <Card style={{ borderRadius: 12 }} className='chartCard'>
        {
            pairs.length > 0 && <Popover content={<div className='chartContainer'>
                <div className='chartHead'>
                    <div className='chartBack'>
                        <ArrowLeftOutlined
                            onClick={() => setOpen(false)}
                            style={{ fontSize: 16, color: '#1E2BFF', fontWeight: 700 }}
                        />
                    </div>
                    <div className='chartTitle'>{_('select_pair')}</div>
                    <div className='ChartDone'></div>
                </div>
                <TokenList showList={pairs} currentPair={curPair} />
            </div>} open={open} showArrow={true}
                onOpenChange={setOpen} placement='bottomLeft' trigger={['click']}>
                <div className="pairTitle">
                    <TokenPair
                        symbol1={curPair.pairName.split('-')[0]}
                        genesisID1={curPair.pairName.split('-')[0]}
                        url1={icons[curPair.pairName.split('-')[0]] || ''}
                        url2={icons[curPair.pairName.split('-')[1]] || ''}
                        symbol2={curPair.pairName.split('-')[1]}
                        genesisID2={curPair.pairName.split('-')[1]}
                        size={32}
                    />

                    {displayPairName}
                    <DownOutlined style={{ fontSize: 15, fontWeight: 'bold' }} />
                </div>
            </Popover>
        }

        <div style={{ display: 'flex', fontSize: 11, color: '#303133', marginBottom: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ background: "#259F2F", width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginRight: 6 }}></span>
                {
                    isUSDTPair ? 'USDT' : ' SATOSHI(0.00000001 SPACE)'
                }

            </span>

        </div>

        <Row >
            <Col xs={24} md={12}>
                <TradingView symbol1={curPair.token1.symbol} symbol2={curPair.token2.symbol} />
            </Col>
            <Col xs={24} md={12}>
                <div className='barChartWrap'>
                    <BarChart symbol={curPair.pairName} tickSpacing={curPair.tickSpacing} tickLower={tickLower} tickUpper={tickUpper} priceTick={priceTicker} curPair={curPair} />
                    {children}
                </div>
            </Col>


        </Row>

    </Card>
}