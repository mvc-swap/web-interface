import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import api from '../../api/poolv2';
const BarChart = ({ symbol, tickSpacing }) => {
    const [data, setData] = useState([]);;
    const [loading, setLoading] = useState(true);
    const barChartRef = useRef(null);
    const fetchData = useCallback(async () => {
        if (symbol && tickSpacing) {
            const res = await api.fetchLiquidity(symbol);
            if (res && res.data) {
                const distribution = {}
                for (const item of data) {
                    const n = (item.tickUpper - item.tickLower) / tickSpacing;
                    console.log(n, 'n')
                    const unit = item.liquidity / n
                    for (let i = 0; i < n; i++) {
                        const key = item.tickLower + i * tickSpacing
                        if (!distribution[key]) {
                            distribution[key] = 0
                        }
                        distribution[item.tickLower + i * tickSpacing] += unit
                    }
                };
                console.log(distribution, 'distribution2')
                const opt = {


                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        data: Object.keys(distribution),
                        silent: false,
                        splitLine: {
                            show: false
                        },
                        splitArea: {
                            show: false
                        }
                    },
                    yAxis: {
                        splitArea: {
                            show: false
                        }
                    },
                    series: [
                        {

                            type: 'bar',

                            data: Object.values(distribution),
                            large: true
                        }
                    ]
                }
                echarts.init(barChartRef.current).setOption(opt)
                setData(res.data);
            }
        }
        setLoading(false)
    }, [symbol, tickSpacing])

    useEffect(() => {
        fetchData()
    }, [fetchData])
    return <div ref={barChartRef} style={{ height: "220px", width: '220px', margin: '0 auto' }}></div>
}
export default BarChart