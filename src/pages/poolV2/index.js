import React, { useCallback, useEffect } from 'react';
import Notice from 'components/notice';
import { PlusCircleFilled } from '@ant-design/icons';
import Layout from '../layout';
import Header from '../layout/header';
import './index.less'
import { connect } from 'dva';
import api from '../../api/poolv2';
const PositionCard = ({ pair, spreadFactor, status, selectedRange }) => (
    <div className="position-card">
        <div className="pair">{pair}</div>
        <div className="spread-factor">{spreadFactor} Spread Factor</div>
        <div className={`status ${status.replace(/\s+/g, '-').toLowerCase()}`}>{status}</div>
        <div className="selected-range">{selectedRange}</div>
    </div>
);
const PoolV2 = ({ user }) => {
    console.log(user)
    const [positions, setPositions] = React.useState([]);
    const getUserPoolV2s = useCallback(async () => {
        if (user && user.isLogin && user.accountInfo && user.accountInfo.userAddress) {
            const res = await api.queryUserPositions(user.accountInfo.userAddress);
            // if(res&&res.data){
            //     setUserPoolV2s(res.data);
            // }
            console.log(res)
        }
    }, [user])

    useEffect(() => { getUserPoolV2s() },
        [getUserPoolV2s])

    return (
        <Layout>
            <Notice />
            <div className='poolV2container' >
                <Header />
                <div className='wrap'>
                    <div className="positionContainer">
                        <div className="leftPosition">Your Positions</div>
                        <div className="rightPosition"><PlusCircleFilled style={{ color: '#1e2bff' }} /> New Position</div>
                    </div>
                    <div className="positions-list">
                        {positions.map((position) => (
                            <PositionCard key={position.id} {...position} />
                        ))}
                        <div className="no-more">No More</div>
                    </div>
                    <div className="nothing-here">
                        <div className="nothing-here-icon">📄</div>
                        <div className="nothing-here-text">Nothing Here...</div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

const mapStateToProps = ({ user }) => {
    return {
        user,
    };
};

export default connect(mapStateToProps)(PoolV2);
