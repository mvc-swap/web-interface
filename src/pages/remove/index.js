'use strict';
import React, { Component } from 'react';
import { connect } from 'umi';
import { Slider, Button, Spin, message } from 'antd';
// import Chart from 'components/chart';
import CustomIcon from 'components/icon';
import Pair from 'components/pair';
import Loading from 'components/loading';
import TokenLogo from 'components/tokenicon';
import { CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { formatSat, formatAmount, jc } from 'common/utils';
import EventBus from 'common/eventBus';
import Pool from '../pool';
import styles from './index.less';
import _ from 'i18n';

// import Header from '../layout/header';
import { withRouter } from 'umi';
import BigNumber from 'bignumber.js';

const datas = [
  {
    label: '25%',
    value: 25,
  },
  {
    label: '50%',
    value: 50,
  },
  {
    label: '75%',
    value: 75,
  },
  {
    label: _('max'),
    value: 100,
  },
];

@withRouter
@connect(({ user, pair, loading }) => {
  const { effects } = loading;
  return {
    ...user,
    ...pair,
    loading: effects['pair/getAllPairs'] || effects['pair/getPairData'],
    submiting:
      effects['pair/reqSwap'] ||
      effects['pair/removeLiq'] ||
      effects['user/transferBsv'] ||
      effects['user/transferFtTres'] ||
      false,
  };
})
export default class RemovePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
      page: 'form',
      formFinish: false,
      symbol1: '',
      symbol2: '',
      removeToken1: 0,
      removeToken2: 0,
      price: 0,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    const { dispatch } = this.props;
    const allPairs = await dispatch({
      type: 'pair/getAllPairs',
    });
    console.log(allPairs);

    let { currentPair } = this.props;
    console.log(currentPair);
    const pairData = await dispatch({
      type: 'pair/getPairData',
      payload: {
        currentPair,
      },
    });
    console.log(pairData);

    const { swapToken1Amount, swapToken2Amount } = pairData;
    const { token1, token2 } = allPairs[currentPair];
    const symbol1 = token1.symbol.toUpperCase();
    const symbol2 = token2.symbol.toUpperCase();
    const price = BigNumber(swapToken2Amount).div(swapToken1Amount).toNumber();
    this.setState({
      symbol1,
      symbol2,
      price: formatAmount(price),
    });
  }

  renderContent() {
    const { currentPair, pairData, loading, LP, allPairs } = this.props;
    if (loading || !currentPair) return <Loading />;
    const { symbol1, symbol2 } = this.state;
    return (
      <div className={styles.content}>
        <div className={styles.main_title}>
          <h2>
            <div className={styles.icon}>
              <TokenLogo name={symbol1} size={40} />
              <TokenLogo name={symbol2} size={40} />
            </div>
            <div className={styles.name}>
              {symbol1}/{symbol2}
            </div>
          </h2>
          <div className={styles.subtitle}>{_('your_liq')}</div>
          <div className={styles.fiat}>$</div>
        </div>
        <Pair pairData={pairData} curPair={allPairs[currentPair]} LP={LP} />
      </div>
    );
  }

  changeData = (value) => {
    this.setState({ value });
  };

  slideData = (value) => {
    this.setState({ value });
  };
  calc = () => {
    const { value } = this.state;
    const { currentPair, pairData, LP, allPairs } = this.props;
    const { swapToken1Amount, swapToken2Amount, swapLpAmount } = pairData;
    const removeLP = (LP * value) / 100;
    const rate = removeLP / swapLpAmount;
    const { token1, token2 } = allPairs[currentPair];
    const removeToken1 = formatSat(
      swapToken1Amount * rate,
      token1.decimal || 8,
    );
    const removeToken2 = formatSat(swapToken2Amount * rate, token2.decimal);
    return {
      removeToken1: formatAmount(removeToken1, 8),
      removeToken2: formatAmount(removeToken2, 8),
      removeLP,
    };
  };

  renderForm() {
    const { currentPair, loading, submiting } = this.props;
    if (loading || !currentPair) return <Loading />;
    const { value, price, symbol1, symbol2 } = this.state;
    const { removeToken1, removeToken2, removeLP } = this.calc();
    return (
      <div className={styles.content}>
        <Spin spinning={submiting}>
          <div className={styles.title}>
            <h3>{_('remove_liq')}</h3>
          </div>
          <div className={styles.data}>{value}%</div>
          <Slider value={value} onChange={this.slideData} />

          <div className={styles.datas}>
            {datas.map((item) => (
              <div
                className={styles.d}
                onClick={() => this.changeData(item.value)}
                key={item.value}
              >
                {item.label}
              </div>
            ))}
          </div>

          <div className={styles.pair_box}>
            <div className={styles.pair_left}>
              <div className={styles.icon}>
                <TokenLogo name={symbol1} size={25} />
                <TokenLogo name={symbol2} size={25} />
              </div>
              <div className={styles.name}>
                {symbol1}/{symbol2}
              </div>
            </div>
            <div className={styles.pair_right}>{removeLP}</div>
          </div>

          <div className={styles.switch_icon}>
            <div className={styles.icon} onClick={this.switch}>
              <CustomIcon type="iconswitch" style={{ fontSize: 20 }} />
            </div>
            <div className={styles.line}></div>
          </div>

          <div className={styles.values}>
            <div className={styles.v_item}>
              <div className={styles.value}>{removeToken1}</div>
              <div className={styles.label}>
                <TokenLogo name={symbol1} size={30} /> {symbol1}
              </div>
            </div>
            <div className={styles.v_item}>
              <div className={styles.value}>{removeToken2}</div>
              <div className={styles.label}>
                <TokenLogo name={symbol2} size={25} /> {symbol2}
              </div>
            </div>
          </div>

          <div className={styles.price}>
            <div className={styles.label}>{_('price')}</div>
            <div className={styles.value}>
              <div>
                1 {symbol1} = {price} {symbol2}
              </div>
            </div>
          </div>

          {this.renderButton()}
        </Spin>
      </div>
    );
  }

  handleSubmit = async () => {
    const { value } = this.state;
    const { dispatch, currentPair, userAddress, token2, LP } = this.props;

    let res = await dispatch({
      type: 'pair/reqSwap',
      payload: {
        symbol: currentPair,
        address: userAddress,
        op: 2,
      },
    });

    if (res.code) {
      return message.error(res.msg);
    }

    const { tokenToAddress, requestIndex } = res.data;

    const _value = BigNumber(value)
      .multipliedBy(LP)
      .div(100)
      .multipliedBy(Math.pow(10, token2.decimal))
      .toNumber();
    const token_tx_res = await dispatch({
      type: 'user/transferFtTres',
      payload: {
        address: tokenToAddress,
        amount: _value,
        codehash: token2.codeHash,
        genesishash: token2.genesisHash,
      },
    });

    console.log(token_tx_res);

    if (token_tx_res.msg) {
      return message.error(token_tx_res.msg);
    }

    const removeliq_res = await dispatch({
      type: 'pair/removeLiq',
      payload: {
        symbol: currentPair,
        requestIndex: requestIndex,
        lpTokenTxID: token_tx_res.txid,
        lpTokenOutputIndex: 1,
      },
    });

    if (removeliq_res.code) {
      return message.error(removeliq_res.msg);
    }
    message.success('success');
    this.setState({
      formFinish: true,
    });
  };

  login() {
    EventBus.emit('login');
  }

  renderButton() {
    const { isLogin, pairData } = this.props;
    if (!isLogin) {
      // 未登录
      return (
        <Button className={styles.btn_wait} onClick={this.login}>
          {_('login')}
        </Button>
      );
    } else if (!pairData) {
      // 不存在的交易对
      return <Button className={styles.btn_wait}>{_('no_pair')}</Button>;
    } else {
      return (
        <Button
          className={styles.btn}
          type="primary"
          onClick={this.handleSubmit}
        >
          {_('remove')}
        </Button>
      );
    }
  }

  renderInfo() {
    const { symbol1, symbol2 } = this.state;
    const { removeToken1, removeToken2 } = this.calc();
    return (
      <div className={styles.my_pair_info}>
        <div className={styles.info_title_swap}>
          <div className={styles.info_title}>{_('your_re_liq')}</div>
        </div>
        <div className={styles.info_item}>
          <div className={styles.info_label}>{symbol1}</div>
          <div className={styles.info_value}>{removeToken1}</div>
        </div>
        <div className={styles.info_item}>
          <div className={styles.info_label}>{symbol2}</div>
          <div className={styles.info_value}>{removeToken2}</div>
        </div>
      </div>
    );
  }

  renderResult() {
    const { LP } = this.props;
    const { symbol1, symbol2 } = this.state;
    const { removeLP } = this.calc();
    return (
      <div className={styles.content}>
        <div className={styles.finish_logo}>
          <CheckCircleOutlined style={{ fontSize: 80, color: '#2BB696' }} />
        </div>
        <div className={styles.finish_title}>{_('liq_removed')}</div>
        <div className={styles.small_title}>{_('your_pos')}</div>

        <div className={styles.pair_box}>
          <div className={styles.pair_left}>
            <div className={styles.icon}>
              <CustomIcon type="iconlogo-bitcoin" />
              <CustomIcon type="iconlogo-vusd" />
            </div>
            <div className={styles.name}>
              {symbol1}/{symbol2}
            </div>
          </div>
          <div className={styles.pair_right}>{LP - removeLP}</div>
        </div>

        {this.renderInfo()}
        <Button
          type="primary"
          className={styles.done_btn}
          onClick={() => {
            this.setState({
              formFinish: false,
              value: 0,
            });
          }}
        >
          {_('done')}
        </Button>
      </div>
    );
  }

  render() {
    const { page, formFinish } = this.state;
    return (
      <Pool>
        <div
          className={styles.container}
          style={{ display: page === 'form' ? 'block' : 'none' }}
        >
          <div className={styles.head}>
            <div className={styles.menu}>
              <span
                className={styles.menu_item}
                key="add_liq"
                onClick={() => {
                  this.props.history.push('/pool/add');
                }}
              >
                {_('add_liq')}
              </span>
              <span
                className={jc(styles.menu_item, styles.menu_item_selected)}
                key="remove_liq"
              >
                {_('remove_liq')}
              </span>
            </div>
            <div className={styles.help}>
              <QuestionCircleOutlined />
            </div>
          </div>
          {formFinish ? this.renderResult() : this.renderForm()}
        </div>
      </Pool>
    );
  }
}
