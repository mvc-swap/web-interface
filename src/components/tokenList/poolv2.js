'use strict';
import React, { Component } from 'react';
import { history, connect } from 'umi';
import EventBus from 'common/eventBus';
import { Spin } from 'antd';
import _ from 'i18n';
import Search from './search';
import List from './list';
import Pair from './pairv2';
import styles from './index.less';

@connect(({ poolV2 }) => {
    return {
        ...poolV2,
    };
})
export default class PairList extends Component {
    constructor(props) {
        super(props);
        // console.log(props.token1Arr, props.token2Arr)
        this.state = {
            showList: props.showList,
        };

    }

    handlePairs(pairs) {
        let arr = [];
        Object.keys(pairs).forEach((item) => {
            const { token1, token2 } = pairs[item];
            const _obj = {
                ...pairs[item],
                name: token1.symbol + '-' + token2.symbol,
                id: item,
                tokenIDs: token1.tokenID || token1.symbol + '-' + token2.tokenID,
            };
            arr.push(_obj);
        });
        arr.sort((a, b) => {
            return b.poolAmount - a.poolAmount;
        });
        return arr;
    }

    changeShowList = (list) => {
        this.setState({
            showList: list,
        });
    };

    changePair = async (tokenID) => {
        const { handleChange } = this.props
        handleChange && handleChange(tokenID)
    };

    render() {
        const { showList } = this.state
        const {
            size = 'big',
            currentPair,
            loading = false,
            type,
            currentToken,
            currentToken2,

        } = this.props;

        return (
            <div className={styles[size]}>
                <Search
                    changeShowList={this.changeShowList}
                    allPairs={this.props.showList}
                    type={type}
                />
                <Spin spinning={loading}>
                    <Pair showList={showList} currentPair={this.props.currentPair} />
                </Spin>
            </div>
        );
    }
}
