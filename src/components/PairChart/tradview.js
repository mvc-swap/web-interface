import { useRef, useState, useEffect } from "react";
import { createChart, CrosshairMode } from 'lightweight-charts';
const chartUrl = 'https://api.mvcswap.com/stats/chartdata/';
const TradingView = ({ symbol1, symbol2 }) => {
    const tvRef = useRef(null);
    const chartWrapRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(973);

    useEffect(() => {
        if (!tvRef.current) return
        const chart = createChart(tvRef.current, {
            width: chartWidth,
            height: 300,
            autoSize: true,
            layout: {
                backgroundColor: '#FFFFFF',
                textColor: 'rgba(33, 56, 77, 1)',
                bottomColor: 'red'
            },
            grid: {
                vertLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
                horzLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
            },
            gridLine: {
                color: 'red',
                style: 'dotted',
                visible: false
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },

            localization: {
                locale: 'en-US',
                //dateFormat: 'yyyy/MM/dd', // adjust
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.5)', // 设置价格刻度的边框颜色为红色
            },
            leftPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.5)', // 设置价格刻度的边框颜色为红色
            },

        });

        const upColor = '#0ECB81'; // green
        const downColor = '#F6465D'; // red
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: upColor,
            downColor: downColor,
            borderDownColor: downColor,
            borderUpColor: upColor,
            wickDownColor: downColor,
            wickUpColor: upColor,
            wickColor: '#f0f0f0'
        });
        chart.timeScale().applyOptions({
            borderColor: "rgba(197, 203, 206, 0.5)",
        });
        chart.applyOptions({
            leftPriceScale: {
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
                invertScale: true,
            },
        });
        chart.priceScale().applyOptions({
            borderColor: 'red'
        })
        try {
            const colname =
                symbol1.toLowerCase() +
                '-' +
                symbol2.toLowerCase() +
                '-candle-1d&limit=100';
            const uri = chartUrl + '?colname=' + colname;
            fetch(uri) // Replace with your data source or API endpoint
                .then((res) => res.json())
                .then((data) => {

                    const items = data.data;
                    items.sort((a, b) => {
                        return a.time - b.time;
                    });
                    candlestickSeries.setData(items);
                })
                .catch((err) => console.log(err));

        } catch (e) {
            console.log(e);
        }

        chart.timeScale().fitContent();

        // Cleanup the effect to avoid memory leaks when the component is unmounted
        return () => chart.remove();
    }, [chartWidth, symbol1, symbol2]);
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
    return <div ref={chartWrapRef}>
        <div style={{ height: 300 }}
            ref={tvRef}
        ></div>
    </div>
};
export default TradingView;