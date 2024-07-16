import Layout from '../../pages/layout';
import Notice from 'components/notice';
import Header from '../../pages/layout/header';
import { Spin } from 'antd';
import './index.less'

export default ({ children, spining = false }) => {
    return <Layout>
        <Notice />
        <div className='pageContainer' >
            <Header />
            <Spin spinning={spining}>
                {children}
            </Spin>
        </div>
    </Layout>
}