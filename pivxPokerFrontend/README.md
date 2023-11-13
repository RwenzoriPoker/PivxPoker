Updated so that the system can run on nodejs v20

The only remaining vulnerablities are build based issue and will not make it into the build files. More info https://github.com/facebook/create-react-app/issues/11174
```
npm audit --production 
```
Need to enable legacy openSSL support

export NODE_OPTIONS=--openssl-legacy-provider

change urls at /src/shared/apiConfig.js