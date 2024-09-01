'use strict';
import React, { useMemo } from 'react';
import FormatNumber from 'components/formatNumber';
import PairIcon from 'components/pairIcon';
import { formatSat } from 'common/utils';
import styles from './index.less';
import _ from 'i18n';
import { connect } from 'umi';


function PairStat(props) {
  const { swapToken1Amount, swapToken2Amount, token1, token2 } =
    props.pairData || {};
  const { pairs = [] } = props.poolV2 || { pairs: [] };
  const v2Pair = useMemo(() => {
    return pairs.find((item) => item.token1.tokenID === token1.tokenID && item.token2.tokenID === token2.tokenID);
  }, [pairs,token1,token2])

  const amount1 = useMemo(() => {
    if (v2Pair) {
      return formatSat(Number(v2Pair.token1Amount) + Number(swapToken1Amount), token1.decimal);
    }
    return formatSat(swapToken1Amount, token1.decimal);

  }, [swapToken1Amount, v2Pair, token1])

  const amount2 = useMemo(()=>{
    if(v2Pair){
      return formatSat(Number(v2Pair.token2Amount) + Number(swapToken2Amount), token2.decimal);
    }
    return formatSat(swapToken2Amount, token2.decimal);
  },[swapToken1Amount, v2Pair, token2])

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <div className={styles.label}>{_('pooled_tokens')}</div>

        <div className={styles.value2} key={token1.tokenid}>
          <PairIcon keyword="token1">
            <FormatNumber value={amount1} />{' '}
          </PairIcon>
        </div>
        <div className={styles.value2} key={token2.tokenid}>
          <PairIcon keyword="token2">
            <FormatNumber value={amount2} />{' '}
          </PairIcon>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = ({ poolV2 }) => {
  return {
    poolV2
  };
};

export default connect(mapStateToProps)(PairStat);
