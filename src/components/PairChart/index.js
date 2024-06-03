import { Card } from 'antd'
import { useRef, useEffect,useState } from 'react';
export default ({ children }) => {
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
    return <Card style={{ borderRadius: 12 }}>

        <div ref={chartWrapRef}>
            <div style={{ height: 300 }}
                ref={tvRef}
            ></div>
        </div>
        <div className='rightContent'>
            {children}
        </div>
    </Card>
}