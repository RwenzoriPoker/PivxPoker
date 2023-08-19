const apiConfig = {
  currentEnv: 'dev',
  prod: 'https://mainnet.pivx.poker/api',
  staging: '',
  dev: 'https://mainnet.pivx.poker/api',
  // endPoint: 'ws://mainnet.pivx.poker',
  endPoint: 'https://mainnet.pivx.poker',
  api: 'https://mainnet.pivx.poker',
  app: 'https://mainnet.pivx.poker',


  signUp: { url: '/signup', method: 'post' },
  authenticate: { url: '/authenticate', method: 'post' },
  withdrawal : {url: '/withdrawal', method: 'post' },
  wallet: {url: '/wallet', method: 'get' },
  profile:{url: '/profile', method: 'post' },
  changePassword:{url: '/change-password', method: 'post' },
  getBonus:{url: '/bonus', method: 'get' },
  postFeedback:{url: '/feedback', method: 'post' }
  

};

export default apiConfig;
