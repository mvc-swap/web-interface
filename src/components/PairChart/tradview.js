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
            height: 270,
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

        const isSpaceQuote = (symbol1.toLowerCase() === 'space' || symbol1 === 'wbtc')  && symbol2.toLowerCase() !== 'usdt';

        let precision = 4
        let minMove = 0.0001
        if (isSpaceQuote) {
          precision = 6
          minMove = 0.000001
        }

        const upColor = '#0ECB81'; // green
        const downColor = '#F6465D'; // red
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: upColor,
            downColor: downColor,
            borderDownColor: downColor,
            borderUpColor: upColor,
            wickDownColor: downColor,
            wickUpColor: upColor,
            wickColor: '#f0f0f0',
            priceFormat: {
              type: 'price',
              precision,
              minMove,
            }
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
        // chart.priceScale().applyOptions({
        //     borderColor: 'red'
        // })
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
                    if (isSpaceQuote) {
                        items.forEach((item) => {
                            item.open = item.open / 1e8
                            item.high = item.high / 1e8
                            item.low = item.low / 1e8
                            item.close = item.close / 1e8
                        })
                    }
                    // const dataTest = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }]
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
        <div style={{ height: 270 }}
            ref={tvRef}
        ></div>
    </div>
};
export default TradingView;