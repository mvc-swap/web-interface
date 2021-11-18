'use strict';
import React, { Component } from 'react';
import { connect, history } from 'umi';
import { Button, Spin } from 'antd';
import Notice from 'components/notice';
import { AppTitle } from 'components/ui';
import { jc, parseUrl } from 'common/utils';
import EventBus from 'common/eventBus';
import Header from '../layout/header';
import FarmList from './farmList';
import Deposit from '../deposit';
import Withdraw from '../withdraw';
// import debug from 'debug';
import styles from './index.less';
import _ from 'i18n';
import { AppStartBtn } from '../../components/ui';
// const log = debug('farm');
let busy = false;

@connect(({ pair, user, farm, loading }) => {
  const { effects } = loading;
  return {
    ...pair,
    ...user,
    ...farm,
    loading:
      effects['farm/getAllPairs'] ||
      effects['farm/getPairData'] ||
      effects['pair/getAllPairs'] ||
      false,
    submiting:
      effects['farm/reqSwap'] ||
      effects['farm/harvest'] ||
      effects['farm/harvest2'] ||
      effects['user/transferBsv'] ||
      effects['user/signTx'] ||
      false,
  };
})
export default class FarmC extends Component {
  constructor(props) {
    super(props);
    this.state = {
      app_pannel: false,
      current_item: 0,
      currentMenuIndex: 0,
    };
    window.addEventListener('hashchange', (event) => {
      const { newURL, oldURL } = event;
      if (newURL !== oldURL) {
        let newHash = newURL.substr(newURL.indexOf('#'));
        let oldHash = oldURL.substr(oldURL.indexOf('#'));
        const newpair = parseUrl(newHash);
        const oldpair = parseUrl(oldHash);
        if (newpair && newpair !== oldpair) {
          EventBus.emit('changeFarmPair');
          props.dispatch({
            type: 'farm/saveFarm',
            payload: {
              currentFarmPair: newpair,
            },
          });
        }
      }
    });
  }

  componentDidMount() {
    EventBus.on('reloadPair', () => {
      const { hash } = window.location;
      if (hash.indexOf('farm') > -1) {
        this.fetch();
      }
    });
    this.fetch();
  }

  fetch = async () => {
    this.updateFarmPairs();
    this.props.dispatch({
      type: 'pair/getAllPairs',
      payload: {},
    });
  };

  updateFarmPairs = async () => {
    if (busy) return;
    busy = true;
    const { dispatch, accountInfo } = this.props;
    const { userAddress } = accountInfo;
    await dispatch({
      type: 'farm/getAllPairs',
      payload: {
        address: userAddress,
      },
    });
    busy = false;
  };

  showPannel = (index) => {
    this.setState({
      app_pannel: true,
      currentMenuIndex: index,
    });
  };

  hidePannel = () => {
    this.setState({
      app_pannel: false,
    });
  };

  changeCurrentFarm = async (currentFarmPair) => {
    const { allFarmPairs, dispatch } = this.props;

    let { hash } = location;
    if (hash.indexOf('farm') > -1) {
      history.push(`/farm/${currentFarmPair}`);
    }
    dispatch({
      type: 'farm/saveFarm',
      payload: {
        currentFarmPair,
        allFarmPairs,
      },
    });
  };

  render() {
    const { app_pannel, currentMenuIndex } = this.state;
    return (
      <>
        <Notice />
        <Spin spinning={this.props.submiting}>
          <section className={styles.container}>
            <section
              className={
                app_pannel ? jc(styles.left, styles.app_hide) : styles.left
              }
            >
              <div className={styles.left_inner}>
                <Header />
                <FarmList {...this.props} update={this.fetch} />
                <AppStartBtn
                  btns={[
                    {
                      txt: _('deposit_lp'),
                      key: 0,
                    },
                    {
                      txt: _('withdraw_lp'),
                      key: 1,
                    },
                  ]}
                  onClick={this.showPannel}
                />
              </div>
            </section>
            <section className={styles.right}>
              <div
                className={
                  app_pannel
                    ? styles.sidebar
                    : jc(styles.sidebar, styles.app_hide)
                }
              >
                <AppTitle title={_('farm')} onClick={this.hidePannel} />

                <div className={styles.right_box}>
                  <div className={styles.head}>
                    <div className={styles.menu}>
                      {['deposit', 'withdraw'].map((item, index) => (
                        <span
                          className={
                            index === currentMenuIndex
                              ? jc(styles.menu_item, styles.menu_item_selected)
                              : styles.menu_item
                          }
                          key={item}
                          onClick={() => {
                            this.setState({
                              currentMenuIndex: index,
                            });
                          }}
                        >
                          {_(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {currentMenuIndex === 0 && <Deposit />}
                  {currentMenuIndex === 1 && <Withdraw />}
                </div>
              </div>
            </section>
          </section>
        </Spin>
      </>
    );
  }
}
