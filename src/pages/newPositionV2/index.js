import PageContainer from "../../components/PageContainer"
import { LeftOutlined } from '@ant-design/icons';
import { Divider, InputNumber } from "antd";
import { history } from 'umi'
import './index.less'
import PairChart from "../../components/PairChart";

export default () => {
    return <PageContainer>
        <div className="newPositionPage">
            <div className="titleWraper">
                <div className="actions" onClick={() => { history.goBack() }}><LeftOutlined style={{ color: '#909399' }} /> Back </div>
                <div className="title"> New Position</div>
                <div className="subfix"></div>
            </div>
            <Divider />
            <div className="FormItemTitle">Price range</div>
            <PairChart>
                <div className="inputWrap">
                    <div className="label">
                        high
                    </div>
                    <InputNumber bordered={false} controls={false} style={{ textAlign: 'right' }}></InputNumber>
                </div>
                <div className="inputWrap">
                    <div className="label">
                        low
                    </div>
                    <InputNumber bordered={false} controls={false}></InputNumber>
                </div>
            </PairChart>
        </div>
    </PageContainer>
}