import React, { Component, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Notice from 'components/notice';
import { DownOutlined } from '@ant-design/icons';
import Layout from '../layout';
import Header from '../layout/header';
import { Spin, Row, Col, Card, Statistic, Popover } from 'antd';
import * as echarts from 'echarts';
import api from '../../api/stats'
import { createChart, CrosshairMode } from 'lightweight-charts';
import TokenLogo from 'components/tokenicon';
import TokenList from 'components/tokenList/stats';
import fdv from '../../assets/fdv.svg'
import tag from '../../assets/tag.svg'
import supply from '../../assets/supply.svg'
import maxSupply from '../../assets/maxSupply.svg'
import fire from '../../assets/fire.svg'
import fire2 from '../../assets/fire2.svg'
import mc from '../../assets/mc.svg'
import swap from '../../assets/swap.svg'
import useIntervalAsync from '../../hooks/useIntervalAsync';
import { ArrowLeftOutlined } from '@ant-design/icons';
import styles from './index.less';
import _ from 'i18n';
import { useParams, history } from 'umi';

const colProps = { md: 8, sm: 12, xs: 24 };
const chartColProps = { md: 12, sm: 12, xs: 24 };

const getIcon = (icons = [], symbol) => {
    const find = icons.find(item => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (find) {
        return `https://icons.mvcswap.com/resources/${find.logo}`
    }
    return null
}



export default () => {
    const supplyChartRef = useRef(null);
    const burnChartRef = useRef(null);
    const params = useParams();
    const tvRef = useRef(null);
    const chartWrapRef = useRef(null);
    const [tokens, setTokens] = useState([]);
    const [icons, setIcons] = useState([]);
    const [chartWidth, setChartWidth] = useState(973);
    const [curToken, setCurToken] = useState();
    const [curInfo, setCurInfo] = useState();
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const getTokens = useCallback(async () => {
        const retIcons = await api.queryIcons();
        if (retIcons.success === true) {
            const { data } = retIcons;
            setIcons(data);
        }
        const ret = await api.queryTokens();
        if (ret.code === 0) {
            const { data } = ret;
            let _tokens = []
            for (let item in data) {
                _tokens.push({ symbol: item, ...data[item], type: data[item].tokenType, tokenID: item, logo: getIcon(retIcons.data, item) })
            }
            setTokens(_tokens);
            if (!curToken) {
                if (params && params.id) {
                    const find = _tokens.find(item => item.symbol.toUpperCase() === params.id.toUpperCase());
                    if (find) {
                        setCurToken(find);
                        return
                    }
                }
                history.push(`/stats/${_tokens[0].symbol}`);
                setCurToken(_tokens[0])

            }
        }
    }, []);
    const getIconss = useCallback(async () => {
        const ret = await api.queryIcons();
        if (ret.success === true) {
            const { data } = ret;
            setIcons(data);
        }
    }, []);
    const getCurInfo = useCallback(async () => {
        if (curToken) {
            const ret = await api.queryStatInfo(curToken.symbol);
            if (ret.code === 0) {
                const { data } = ret;
                const { price, currentSupply, burnSupply, maxSupply } = data
                data.MarketCap = price * currentSupply
                data.FDV = price * (maxSupply - burnSupply)
                data.SupplyRate = currentSupply / maxSupply * 100
                data.BurnRate = burnSupply / currentSupply * 100;
                if (data.BurnRate === 0) {
                    data.BurnRate = 0.001
                }
                if (data.SupplyRate === 0) {
                    data.SupplyRate = 0.001
                }
                setCurInfo(data)
                setLoading(false)
            }
        }
    }, [curToken])

    useIntervalAsync(getCurInfo, 60000)


    useEffect(() => {
        getTokens()
        getIconss()
    }, [getTokens, getIconss])


    const supplyRate = useMemo(() => {
        if (!curInfo) return null
        return {
            series: [
                {
                    type: 'gauge',
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    radius: '100%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
                            offset: 0,
                            color: '#72F5F6'
                        }, {
                            offset: 1,
                            color: '#171AFF'
                        }])

                    },
                    progress: {
                        show: true,
                        roundCap: true,
                        width: 6
                    },
                    pointer: {
                        icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
                        length: '75%',
                        width: 14,
                        offsetCenter: [0, '5%']
                    },
                    axisLine: {
                        roundCap: true,
                        lineStyle: {
                            width: 6
                        }
                    },
                    axisTick: {
                        splitNumber: 2,
                        lineStyle: {
                            width: 0,
                            color: '#999'
                        }
                    },
                    splitLine: {

                        length: 0,
                        lineStyle: {
                            width: 0,
                            color: '#fff'
                        }
                    },
                    axisLabel: {
                        distance: 30,
                        color: '#fff',
                        fontSize: 0
                    },
                    title: {
                        show: true,

                    },
                    detail: {
                        backgroundColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 0,

                        lineHeight: 40,
                        height: -44,
                        borderRadius: 0,
                        offsetCenter: [0, 0],
                        valueAnimation: true,
                        formatter: function (value) {
                            return '{value|' + value.toFixed(2) + '%}';
                        },

                        rich: {
                            value: {
                                fontSize: 18,
                                fontWeight: 'bolder',
                                color: '#fff'
                            },

                        }
                    },
                    data: [
                        {
                            value: curInfo.SupplyRate
                        }
                    ]
                }
            ]
        };
    }, [curInfo])

    const burnRate = useMemo(() => {
        if (!curInfo) return null
        return {
            series: [
                {
                    type: 'gauge',
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    radius: '100%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
                            offset: 0,
                            color: '#FF8F1F'
                        }, {
                            offset: 1,
                            color: '#FFE08D'
                        }])

                    },
                    progress: {
                        show: true,
                        roundCap: true,
                        width: 6
                    },
                    pointer: {
                        icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
                        length: '75%',
                        width: 14,
                        offsetCenter: [0, '5%']
                    },
                    axisLine: {
                        roundCap: true,
                        lineStyle: {
                            width: 6
                        }
                    },
                    axisTick: {
                        splitNumber: 2,
                        lineStyle: {
                            width: 0,
                            color: '#999'
                        }
                    },
                    splitLine: {

                        length: 0,
                        lineStyle: {
                            width: 0,
                            color: '#fff'
                        }
                    },
                    axisLabel: {
                        distance: 30,
                        color: '#fff',
                        fontSize: 0
                    },
                    title: {
                        show: true,

                    },
                    detail: {
                        backgroundColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 0,

                        lineHeight: 40,
                        height: -44,
                        borderRadius: 0,
                        offsetCenter: [0, 0],
                        valueAnimation: true,
                        formatter: function (value) {
                            return '{value|' + value.toFixed(2) + '%}';
                        },

                        rich: {
                            value: {
                                fontSize: 18,
                                fontWeight: 'bolder',
                                color: '#fff'

                            },

                        },

                    },
                    data: [
                        {
                            value: curInfo.BurnRate
                        }
                    ]
                }
            ]
        };
    }, [curInfo])

    useEffect(() => {

        let chartInstance;
        let burnChartInstance;
        if (supplyChartRef.current && burnChartRef.current) {
            chartInstance = echarts.init(supplyChartRef.current);
            burnChartInstance = echarts.init(burnChartRef.current);
            chartInstance.setOption(supplyRate);
            burnChartInstance.setOption(burnRate);
        }
        return () => {
            chartInstance && chartInstance.dispose();
            burnChartInstance && burnChartInstance.dispose();
        }

    }, [supplyRate, burnRate])

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

            const items = curInfo.priceData;
            items.sort((a, b) => {
                return a.time - b.time;
            });
            candlestickSeries.setData(items);
        } catch (e) {
            console.log(e);
        }

        chart.timeScale().fitContent();

        // Cleanup the effect to avoid memory leaks when the component is unmounted
        return () => chart.remove();
    }, [curInfo, chartWidth]);

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

    const handleChange = (tokenID) => {
        setLoading(true)
        const token = tokens.find(item => item.tokenID === tokenID);
        history.push(`/stats/${token.symbol}`);
       
        setCurToken(token)
        setOpen(false)
    }

    return <Layout>
        <Notice />
        <div className='container' style={{ margin: '0 auto', padding: '0 0 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>

            <Header />

            <Spin spinning={loading}>
                {curInfo && <Row gutter={[20, 20]} style={{ width: 1043, maxWidth: '100vw' }}>
                    <Col span={24} >
                        <Card style={{ borderRadius: 12 }}>
                            <Popover content={<div className={styles.container}>
                                <div className={styles.head}>
                                    <div className={styles.back}>
                                        <ArrowLeftOutlined
                                            onClick={() => setOpen(false)}
                                            style={{ fontSize: 16, color: '#1E2BFF', fontWeight: 700 }}
                                        />
                                    </div>
                                    <div className={styles.title}>{_('select_token')}</div>
                                    <div className={styles.done}></div>
                                </div>
                                <TokenList showList={tokens} currentToken={curToken.symbol} handleChange={handleChange} />
                            </div>} open={open} showArrow={true}
                                onOpenChange={setOpen} placement='bottomLeft' trigger={['click']}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: "#303133", fontWeight: 'bold', fontSize: 24, cursor: 'pointer' }}>
                                    <TokenLogo name={curToken.symbol}
                                        genesisID={''}
                                        size={32}
                                        url={getIcon(icons, curToken.symbol)}
                                    />
                                    {curToken.symbol.toUpperCase()}
                                    <DownOutlined style={{ fontSize: 15, fontWeight: 'bold' }} />
                                </div>
                            </Popover>


                            <div style={{ display: 'flex', flexDirection: 'row-reverse', fontSize: 11, color: '#303133' }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ background: "#259F2F", width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginRight: 6 }}></span>
                                    USD ({curInfo.price} USD)
                                </span>

                            </div>
                            <div ref={chartWrapRef}>
                                <div style={{ height: 300 }}
                                    ref={tvRef}
                                ></div>
                            </div>
                        </Card>
                    </Col>
                    <Col {...colProps} >
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic
                                title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={supply}></img> <span>Current Supply</span></div>}

                                value={curInfo.currentSupply} valueStyle={{ textAlign: 'center' }} precision={0} /></Card></Col>
                    <Col {...colProps} >
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic
                                title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={fire2}></img> <span>Burned Supply</span></div>}


                                value={curInfo.burnSupply} valueStyle={{ textAlign: 'center' }} precision={0} />
                        </Card></Col>
                    <Col {...colProps} >
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic
                                title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={maxSupply}></img> <span>Max Supply</span></div>}

                                value={curInfo.maxSupply} valueStyle={{ textAlign: 'center' }} precision={0} /></Card></Col>
                    <Col {...colProps}>
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic
                                title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={tag}></img> <span>Price</span></div>}

                                value={curInfo.price} prefix='$' precision={4} valueStyle={{ textAlign: 'center' }} /></Card></Col>
                    <Col {...colProps} >
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic
                                title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={mc}></img> <span>Market Cap</span></div>}

                                value={curInfo.MarketCap} prefix='$' precision={0} valueStyle={{ textAlign: 'center' }} />
                        </Card></Col>
                    <Col {...colProps} >
                        <Card style={{ borderRadius: 12 }}>
                            <Statistic title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}> <img src={fdv}></img> <span>Full Dilluted Valuation</span></div>} value={curInfo.FDV} prefix='$' precision={0} valueStyle={{ textAlign: 'center' }} />
                        </Card>
                    </Col>
                    <Col {...chartColProps}>
                        <Card style={{ borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 24, color: 'rgba(0, 0, 0, 0.45)' }}> <img src={swap}></img> <span>Supply Rate</span></div>
                            <div ref={supplyChartRef} style={{ height: "220px", width: '220px', margin: '0 auto' }}></div>
                            <div style={{ textAlign: 'center', marginTop: -50, background: 'linear-gradient(90deg, #72F5F6 0%, #171AFF 103%)', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 24, fontWeight: 600 }}>
                                {curInfo.SupplyRate.toFixed(2)}%
                            </div>
                        </Card>
                    </Col>
                    <Col {...chartColProps}>
                        <Card style={{ borderRadius: 12, }} >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 24, color: 'rgba(0, 0, 0, 0.45)' }}> <img src={fire}></img> <span>Burn Rate</span></div>
                            <div ref={burnChartRef} style={{ height: "220px", width: '220px', margin: '0 auto' }}></div>
                            <div style={{ textAlign: 'center', marginTop: -50, background: 'linear-gradient(270deg, #FF8F1F 0%, #FFE08D 100%)', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 24, fontWeight: 600 }}>
                                {curInfo.BurnRate.toFixed(2)}%
                            </div>
                        </Card>
                    </Col>
                </Row>}


            </Spin>
        </div>

    </Layout>
}

