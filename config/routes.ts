export default [
  { exact: true, path: '/', component: '@/pages/home' },
  { path: '/swap', component: '@/pages/swapPage' },
  { path: '/swap/:id', component: '@/pages/swapPage' },
  { path: '/pool/add', component: '@/pages/addLiq' },
  { path: '/pool/:id/add', component: '@/pages/addLiq' },
  { path: '/pool/remove', component: '@/pages/remove' },
  { path: '/pool/:id/remove', component: '@/pages/remove' },
  { path: '/pool/create', component: '@/pages/createPair' },
  { path: '/pool/:id/create', component: '@/pages/createPair' },
  { path: '/webwallet', component: '@/pages/webwallet' },
  { path: '/farm', component: '@/pages/farm' },
  { path: '/farm/:id', component: '@/pages/farm' },
  { path: '/stake', component: '@/pages/stake' },
  { path: '/vote', component: '@/pages/vote' },
  { path: '/stats', component: '@/pages/stats' },
  { path: '/stats/:id', component: '@/pages/stats' },
  { path: '/v2pool', component: '@/pages/v2Pool' },
  { path: '/v2pool/add/:pair', component: '@/pages/v2PoolAdd' },
  { path: '/v2pool/pos/:pair', component: '@/pages/v2PoolPos' },
  { path: '/v2pool/remove/:pair', component: '@/pages/v2PoolRemove' },
];
