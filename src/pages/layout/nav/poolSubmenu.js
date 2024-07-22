import { Dropdown, Space, Menu, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import _ from 'i18n';
import { history } from 'umi';
import styles from './index.less';
import { useEffect, useState } from 'react';

const submenu = [
  {
    label: 'Pool v1',
    key: 'pool',
    path: 'pool/add',
  },
  {
    label: 'Pool v2',
    key: 'v2pool',
    path: 'v2pool',
  },
];

function PoolSubmenu() {
  const [currentMenu, setCurrentMenu] = useState(submenu[0].key);

  const getHash = () => {
    return window.location.hash.substr(2);
  };

  useEffect(() => {
    const hash = getHash();
    let _currentMenu = currentMenu;
    submenu.forEach((item) => {
      if (hash.indexOf(item.key) > -1) {
        _currentMenu = item.key;
      }
    });
    setCurrentMenu(_currentMenu);
  }, [window.location]);

  const gotoPage = (anchor) => {
    history.push(`/${anchor}`);
    // this.scrollto(anchor)
  };

  // const menu = (
  //   <div className={styles.submenu}>
  //     {submenu.map((item, index) => {
  //       return (
  //         <div
  //           key={item.key}
  //           className={
  //             item.key === currentMenu && getHash() === item.key
  //               ? `${styles.submenu_item} ${styles.submenu_item_selected}`
  //               : styles.submenu_item
  //           }
  //           onClick={() => gotoPage(item.path)}
  //         >
  //           {item.label}
  //         </div>
  //       );
  //     })}
  //   </div>
  // );
  const menu = (
    <Menu>
      {submenu.map(item => (
        <Menu.Item key={item.key} onClick={() => {
          history.push(`/${item.path}`)
        }}>
          <a >
            {item.label}
          </a>
        </Menu.Item>
      ))
      }
    </Menu>
  );
  return (
    <Dropdown overlay={menu}>
      <span >
        {submenu.find((v) => v.key === currentMenu).label}
        <DownOutlined />
      </span>
    </Dropdown>
  );
}

export default PoolSubmenu;
