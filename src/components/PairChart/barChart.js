import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Spin } from 'antd';
import { Bar } from '@ant-design/plots';
import api from '../../api/poolv2';
import { priceToSqrtX96, sqrtX96ToPrice } from '../../utils/helper';
import { getTickAtSqrtRatio, getSqrtRatioAtTick } from '../../utils/tickMath';
import { isUSDT } from '../../common/utils';
const calcPrice = (curPair, tick) => {
    if (curPair) {
        const isUSDTPair = isUSDT(curPair.token1.genesisTxid, curPair.token2.genesisTxid)
        const minPrice = (sqrtX96ToPrice(getSqrtRatioAtTick(tick))).toFixed(4);
        return isUSDTPair ? (1 / minPrice).toFixed(4) : minPrice
    }
    return 0
}
function reduceArray(arr) {
    const n = arr.length;
    const targetCount = 100;
    const result = [];

    // 添加第一个元素
    result.push(arr[0]);

    // 计算中间部分的采样间隔
    const middleStep = (n - 2) / (targetCount - 2);

    for (let i = 1; i < targetCount - 1; i++) {
        const index = Math.floor(i * middleStep);
        result.push(arr[index]);
    }

    // 添加最后一个元素
    result.push(arr[n - 1]);

    return result;
}
const BarChart = ({ symbol, tickSpacing, tickLower, tickUpper, priceTick, curPair }) => {
    const [loading, setLoading] = useState(true);
    const [distribution, setDistribution] = useState({});
    const fetchData = useCallback(async () => {
        if (symbol && tickSpacing) {
            const res = await api.fetchLiquidity(symbol);

            if (res && res.data) {
                const _distribution = {};
                for (const item of res.data) {
                    const n = (item.tickUpper - item.tickLower) / tickSpacing;

                    const unit = item.liquidity / n;
                    if (Number(unit) === 0) continue;
                    for (let i = 0; i <= n; i++) {
                        const key = item.tickLower + i * tickSpacing;
                        if (!_distribution[key]) {
                            _distribution[key] = 0
                        }

                        _distribution[item.tickLower + i * tickSpacing] += unit
                    }
                };

                setDistribution(_distribution)
            }
        }
        setLoading(false)
    }, [symbol, tickSpacing])
    useEffect(() => {
        fetchData()
    }, [fetchData])

    const config = useMemo(() => {
        const data = []
        for (const key in distribution) {
            data.push({ tick: key, value: distribution[key] })
        }
        let _data = data.filter((item) => Number(item.tick) % (1 * tickSpacing) === 0).sort((a, b) => b.tick - a.tick);

        if (_data.length === 0) return {}
        const upperDvalue = Number(tickUpper) - Number(priceTick);
        const lowerDvalue = Number(priceTick) - Number(tickLower);

        let start = _data[0].tick, end = _data[_data.length - 1].tick;
        // console.log(start, end)
        if (upperDvalue > lowerDvalue) {
            start = Number(tickUpper) + upperDvalue / 5;
            end = Number(priceTick) - upperDvalue - upperDvalue / 5
        } else {
            end = Number(tickLower) - lowerDvalue / 5;
            start = Number(priceTick) + lowerDvalue + lowerDvalue / 5
        }
        _data = _data.filter((item) => Number(item.tick) <= start && Number(item.tick) >= end)
        if (_data.length > 100) {
            _data = reduceArray(_data)
        }

        let _tickLowerIndex, _tickUpperIndex, _priceTickIndex;

        if (priceTick !== undefined && tickLower !== undefined && tickUpper !== undefined) {
            _data.forEach((item, index) => {
                if (_tickLowerIndex === undefined) {
                    if (Number(item.tick) <= tickLower) {
                        _tickLowerIndex = {
                            index,
                            value: item.tick,
                            percent: (index / _data.length) * 100
                        }
                    }
                }
                if (_tickUpperIndex === undefined) {
                    if (Number(item.tick) <= tickUpper) {
                        _tickUpperIndex = {
                            index,
                            value: item.tick,
                            percent: (index / _data.length) * 100
                        }
                    }
                }
                if (_priceTickIndex === undefined) {
                    if (Number(item.tick) <= priceTick) {
                        _priceTickIndex = {
                            index,
                            value: item.tick,
                            percent: (index / _data.length) * 100
                        }
                    }
                }
            });
        }


        const _config = {
            data: _data,
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
                fill: '#DDDFFF',
            },
            interaction: {
                tooltip: {
                    render: (event, { title, items }) => {
                        const price = calcPrice(curPair, title)
                        return <>Tick:{title} Price:{price}</>
                    }
                },

            },
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
        if (_tickLowerIndex && _tickUpperIndex && _priceTickIndex) {
            _config.annotations = [
                {
                    type: 'lineX',
                    xField: _tickLowerIndex.value,
                    style: {
                        stroke: '#259F2F',
                        lineWidth: 1,
                    },
                },
                {
                    type: 'shape',
                    style: {
                        x: '100%',
                        y: _tickLowerIndex.percent + '%',
                        render: ({ x, y }, context, d) => {
                            const { document } = context;
                            const g = document.createElement('g', {});
                            const c1 = document.createElement('circle', {
                                style: {
                                    cx: x,
                                    cy: y,
                                    lineWidth: 1,
                                    r: 4,
                                    stroke: '#259F2F',
                                    opacity: 0.3,
                                },
                            });
                            const c2 = document.createElement('circle', {
                                style: {
                                    cx: x,
                                    cy: y,
                                    lineWidth: 3,
                                    r: 1.5,
                                    stroke: '#259F2F',
                                    opacity: 1,
                                },
                            });

                            g.appendChild(c1);
                            g.appendChild(c2);

                            return g;
                        },
                    },
                },
                {
                    type: 'lineX',
                    xField: _priceTickIndex.value,
                    style: {
                        stroke: '#1E2BFF',
                        lineWidth: 1
                    },
                },
                {
                    type: 'shape',
                    style: {
                        x: '100%',
                        y: _priceTickIndex.percent + '%',
                        render: ({ x, y }, context, d) => {
                            const { document } = context;
                            const g = document.createElement('g', {});
                            const c2 = document.createElement('circle', {
                                style: {
                                    cx: x,
                                    cy: y,
                                    lineWidth: 3,
                                    r: 1.5,
                                    stroke: '#1E2BFF',
                                    opacity: 1,
                                },
                            });
                            g.appendChild(c2);
                            return g;
                        },
                    },
                },
                {
                    type: 'lineX',
                    xField: _tickUpperIndex.value,
                    style: {
                        stroke: '#FF4D4D',
                        lineWidth: 1
                    },
                },
                {
                    type: 'shape',
                    style: {
                        x: '100%',
                        y: _tickUpperIndex.percent + '%',
                        render: ({ x, y }, context, d) => {
                            const { document } = context;
                            const g = document.createElement('g', {});
                            const c1 = document.createElement('circle', {
                                style: {
                                    cx: x,
                                    cy: y,
                                    lineWidth: 1,
                                    r: 4,
                                    stroke: '#FF4D4D',
                                    opacity: 0.3,
                                },
                            });
                            const c2 = document.createElement('circle', {
                                style: {
                                    cx: x,
                                    cy: y,
                                    lineWidth: 3,
                                    r: 1.5,
                                    stroke: '#FF4D4D',
                                    opacity: 1,
                                },
                            });

                            g.appendChild(c1);
                            g.appendChild(c2);

                            return g;
                        },
                    },
                },


            ]
        }


        return _config
    }, [distribution, tickLower, tickUpper, priceTick]);
    return <Spin spinning={loading}>
        <div style={{ width: '190px', height: '224px' }}>

            <Bar {...config} />

        </div>
    </Spin>
}
export default BarChart