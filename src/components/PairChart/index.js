import { Card, Row, Col } from 'antd'
import { useRef, useEffect, useState } from 'react';
import Chart from 'components/chart/swapChart';
import BarChart from './barChart';
import TradingView from './tradview';
export default ({ children, curPair }) => {

    const [chartWidth, setChartWidth] = useState(973);
    const tvRef = useRef(null);
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
    if (!curPair) return <></>
    return <Card style={{ borderRadius: 12 }}>


        <Row >
            <Col span={12}>
                <TradingView symbol1={curPair.token1.symbol} symbol2={curPair.token2.symbol} />
            </Col>
            <Col span={12}>
                <Row>
                    <BarChart symbol={curPair.pairName} tickSpacing={curPair.tickSpacing} />
                    <div>{children}</div>
                </Row>

            </Col>


        </Row>

    </Card>
}