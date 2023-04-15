'use strict';
import React, { Component } from 'react';
import { history } from 'umi';
import { Button } from 'antd';
import Layout from '../layout';
import Lang from '../layout/lang';
import Nav from '../layout/nav';
import Footer from '../layout/footer';
import DarkMode from '../layout/darkmode';
import CustomIcon from 'components/icon';
import Notice from 'components/notice';
import Cookie from 'js-cookie';
import styles from './index.less';
import _ from 'i18n';
import { IconX, IconTick } from 'components/ui';
import scalabilityLogo from '../../../public/assets/scalability.jpg';
import securityLogo from '../../../public/assets/security.jpg';
import speedLogo from '../../../public/assets/speed.jpg';

const _lang = Cookie.get('lang') || navigator.language;
export default class Home extends Component {
  render() {
    const isZh = _lang.toLowerCase() === 'zh-cn';
    return (
      <Layout>
        <Notice />
        <section className={styles.container}>
          <nav className={styles.head}>
            <div className={styles.head_inner}>
              <Nav />
              <div className={styles.head_right}>
                <Button
                  type="primary"
                  className={styles.cta}
                  shape="round"
                  onClick={() => {
                    history.push('swap');
                  }}
                >
                  {_('launch_app')}
                </Button>
                <div className={styles.hidden_mobile}>
                  <Lang />
                </div>
              </div>
            </div>
          </nav>
          <section className={styles.main}>
            <div className={styles.main_title}>{_('mvcswap')}</div>
            <div className={styles.main_desc}>{_('mvcswap_desc')}</div>
            <div className={styles.btns}>
              <Button
                className={styles.btn}
                shape="round"
                onClick={() => {
                  window.location.href = 'https://docs.mvcswap.com/';
                }}
              >
                {_('documentation')}
              </Button>
            </div>
          </section>

          <section className={styles.content}>
            <div className={styles.title_web}>{_('feature')}</div>
            <div className={styles.title_h5}>{_('feature_h5')}</div>
            {/* Add the new feature section */}
            <section className={styles.features}>
              <div className={styles.feature}>
                <img
                  src={securityLogo}
                  alt="security Icon"
                  className={styles.feature_icon}
                />
                <h3>{_('feature_security')}</h3>
                <p>{_('security_desc')}</p>
              </div>
              <div className={styles.feature}>
                <img
                  src={scalabilityLogo}
                  alt="scalability Icon"
                  className={styles.feature_icon}
                />
                <h3>{_('feature_scalability')}</h3>
                <p>{_('scalability_desc')}</p>
              </div>
              <div className={styles.feature}>
                <img
                  src={speedLogo}
                  alt="Speed Icon"
                  className={styles.feature_icon}
                />
                <h3>{_('feature_speed')}</h3>
                <p>{_('speed_desc')}</p>
              </div>
            </section>
          </section>
          <Footer />
        </section>
      </Layout>
    );
  }
}
