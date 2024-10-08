// src/components/TradingViewChart.js
import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { is } from 'ramda';

const chartUrl = 'https://api.mvcswap.com/stats/chartdata/';

const TradingViewChart = (props) => {
  const chartContainerRef = useRef(null);
  let chart;

  useEffect(() => {
    // console.log(window.innerWidth, '------');
    chart = createChart(chartContainerRef.current, {
      width: window.innerWidth < 768 ? 380 : 520,
      height: 300,
      // autoSize: true,
      layout: {
        backgroundColor: '#FFFFFF',
        textColor: 'rgba(33, 56, 77, 1)',
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.5)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.5)',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      priceScale: {
        borderColor: 'rgba(197, 203, 206, 1)',
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 1)',
      },
      localization: {
        locale: 'en-US',
        //dateFormat: 'yyyy/MM/dd', // adjust
      },
    });

    const upColor = '#0ECB81'; // green
    const downColor = '#F6465D'; // red

    const { symbol1, symbol2 } = props;

    const isSpaceQuote = (symbol1.toLowerCase() === 'space' || symbol1 === 'wbtc')  && symbol2.toLowerCase() !== 'usdt';

    let precision = 4
    let minMove = 0.0001
    if (isSpaceQuote) {
      precision = 6
      minMove = 0.000001
    }

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: upColor,
      downColor: downColor,
      borderDownColor: downColor,
      borderUpColor: upColor,
      wickDownColor: downColor,
      wickUpColor: upColor,
      priceFormat: {
        type: 'price',
        precision,
        minMove,
      }
    });


    //TODO: You can fetch the data from an API or use a static dataset
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
          // Map your data to the format required by the library
          /*const chartData = data.data.map(item => ({
                      time: item.date, // e.g., "2020-04-01"
                      open: item.open,
                      high: item.high,
                      low: item.low,
                      close: item.close,
                  }));*/
          const items = data.data;
          if (isSpaceQuote) {
              items.forEach((item) => {
                  item.open = item.open / 1e8
                  item.high = item.high / 1e8
                  item.low = item.low / 1e8
                  item.close = item.close / 1e8
              })
          }
          items.sort((a, b) => {
            return a.time - b.time;
          });
          candlestickSeries.setData(items);
        })
        .catch((err) => console.log(err));
    } catch (e) {
      console.log(e);
    }

    //candlestickSeries.setData(candelData);
    //chart.priceScale().applyOptions({
    //  autoScale: false,
    //  minValue: 0.00000001,
    //  maxValue: 1.0,
    //  precision: 8
    //});

    chart.timeScale().fitContent();

    // Cleanup the effect to avoid memory leaks when the component is unmounted
    return () => chart.remove();
  }, []);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '400px', height: '300px' }}
    ></div>
  );
};

export default TradingViewChart;
