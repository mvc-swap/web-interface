import React from 'react';
import { history } from 'umi';
import EventBus from 'common/eventBus';
import { CheckCircleOutlined } from '@ant-design/icons';
import TokenPair from 'components/tokenPair';
import { isLocalEnv, strAbbreviation } from 'common/utils';
import styles from './index.less';

const { location } = window;

export default class TokenPairList extends React.Component {
  constructor(props) {
    super(props);
    // console.log(props.token1Arr, props.token2Arr

  }
  changeCurrentTokenPair = (currentPair) => {
    const { hash } = location;
    if (hash.indexOf('add') > -1) {
      history.push(`/v2pool/add/${currentPair}`);
      this.setState({
        defaultPair: currentPair,
      });
    }

  };

  renderItem = (item, props) => {
    const { currentPair, type } = props;
    const { token1, token2, id, pairName, tokenIDs, abandoned } = item;
    return (
      <div
        className={styles.item}
        key={pairName}
        onClick={() => this.changeCurrentTokenPair(pairName)}
      >
        <div className={styles.icon_name}>
          <div className={styles.icon}>
            <TokenPair
              symbol1={token1.symbol}
              symbol2={token2.symbol}
              genesisID1={token1.tokenID}
              genesisID2={token2.tokenID}
              size={25}
            />
          </div>
          <div className={styles.name}>
            {pairName.toUpperCase()}
            {abandoned && '(old)'}
          </div>
        </div>

        <div className={styles.genesis_id}>{strAbbreviation((token2.type || 'unknown').toUpperCase())}</div>

        <div className={styles.selected}>
          {location.hash.indexOf(pairName) > -1 && (
            <CheckCircleOutlined
              theme="filled"
              style={{ color: '#1E2BFF', fontSize: 30 }}
            />
          )}
        </div>
      </div>
    );
  };

  render() {
    const { showList = [] } = this.props;
    return (
      <div className={styles.token_list}>
        {showList.map((item) => {
          if ((item.test && isLocalEnv) || !item.test) {
            return this.renderItem(item, this.props);
          }
        })}
      </div>
    );
  }
}
