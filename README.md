# INSTALLATION
Download PIVX core wallet (https://github.com/PIVX-Project/PIVX/releases)

Install pivx core wallet by untar/unzipping the file and running the install-params file

run `/bin/pivxd -daemon`

(set up a restarting instance with systemd https://docs.pivx.org/wallets/pivx-core-wallet/pivx-as-a-service-linux)

create a file in ~/.pivx/pivx.conf containing the following:
**PLEASE CHANGE THE RPCUSER AND PASSWORD ON YOUR VERSION IT ALSO NEEDS TO BE CHANGE IN THE .ENV FILE**

```               
zmqpubrawtx=tcp://127.0.0.1:28332 
testnet
walletnotify 
rpcuser=root
rpcpassword=password
rpcallowip=127.0.0.1
server=1
daemon=1
maxconnections=256
testnet=1
server=1
par=1
rpcbind=127.0.0.1
rpcport=3335
rpcclienttimeout=30
rpcthreads=5
rpcworkqueue=1000
paytxfee=.01
staking=0
enableaccounts=1
```
https://www.mongodb.com/docs/manual/administration/install-on-linux/

install nodejs (19 recommended)
https://github.com/nodesource/distributions/blob/master/README.md

```
sudo apt-get install build-essential
sudo apt install node-pre-gyp
```
`npm i`

Once your pivx Daemon syncs restart it so that it is using the settings from the config file

# Running it
`node index.js`

Using PM2 can help with reliability 
