import Layout from '../../pages/layout';
import Notice from 'components/notice';
import Header from '../../pages/layout/header';
import './index.less'

export default ({ children }) => {
    return <Layout>
        <Notice />
        <div className='pageContainer' >
            <Header />
            {children}

        </div>
    </Layout>
}