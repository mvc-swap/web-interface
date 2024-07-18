import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import { Bar } from '@ant-design/plots';
import api from '../../api/poolv2';
import { set } from 'ramda';
const BarChart = ({ symbol, tickSpacing }) => {
    const [data, setData] = useState([]);;
    const [loading, setLoading] = useState(true);
    // const barChartRef = useRef(null);
    const [distribution, setDistribution] = useState({});
    const fetchData = useCallback(async () => {
        if (symbol && tickSpacing) {
            const res = await api.fetchLiquidity(symbol);
            if (res && res.data) {
                const _distribution = {};
                const tickLiq = []

                for (const item of res.data) {

                    const n = (item.tickUpper - item.tickLower) / tickSpacing;
                    console.log(item, 'item', n)
                    const unit = item.liquidity / n
                    for (let i = 0; i < n; i++) {
                        const key = item.tickLower + i * tickSpacing
                        if (!_distribution[key]) {
                            _distribution[key] = 0
                        }
                        _distribution[item.tickLower + i * tickSpacing] += unit
                    }
                };
                console.log(_distribution)
                setDistribution(_distribution)
            }
        }
        setLoading(false)
    }, [symbol, tickSpacing])
    useEffect(() => {
        fetchData()
    }, [fetchData])
    // const data = [
    //     { category: 'Category 1', value: 10 },
    //     { category: 'Category 2', value: 20 },
    //     { category: 'Category 3', value: 30 },
    //     // 添加更多数据点
    //   ];

    const config = useMemo(() => {
        const data = []
        for (const key in distribution) {
            data.push({ tick: key, value: distribution[key] })
        }
        const _config = {
            data: data.sort((a, b) => a.tick - b.tick),
            titleSpacing: 0,
            xField: 'tick',
            yField: 'value',
            scale: {
                x: {
                    type: 'band',
                    padding: 0,
                    color: '#111',
                },
                y: {

                    padding: 0,
                }
            },
            markBackground: {
                style: {
                    fill: '#eee'
                }
            },
            animate: { enter: { type: 'scaleInX' } },
            style: {
                fill: (cage, b) => {
                    // console.log(cage,b)
                    // if(Number(cage.tick)>1100&&Number(cage.tick)<5000){
                    //     return '#259F2F'
                    // }

                    return '#DDDFFF'
                }
            },
            // interaction: { tooltip: false },
            slider: { y: false, x: false },
            axis: {
                x: {
                    tick: false,
                    label: false,

                },
                y: {
                    tick: false,
                    label: false
                },
            },

        }
        console.log(distribution)
        if (true) {
            _config.annotations = [
                {
                    type: 'lineX',
                    xField: '-1000',
                    style: {
                        arrow: false,
                        stroke: '#FF4D4D',
                        lineDash: [0, 0],
                        lineWidth: 2,

                    },
                    label: {
                        text: '-',
                        position: 'right',
                        dx: -10,
                        style: { textBaseline: 'bottom' },
                    },
                },
                {
                    type: 'lineX',
                    xField: '7000',
                    style: {
                        arrow: false,
                        stroke: '#259F2F',
                        lineDash: [0, 0],
                        lineWidth: 2
                    },
                    label: {
                        text: '-',
                        position: 'right',
                        dx: -10,
                        style: { textBaseline: 'bottom' },
                    },

                },
            ]
        }
        return _config
    }, [distribution]);
    return <div style={{ width: '150px', height: '224px' }}> <Bar {...config} /></div>
}
export default BarChart