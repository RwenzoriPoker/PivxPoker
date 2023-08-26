# INSTALLATION
download PIVX core wallet (https://github.com/PIVX-Project/PIVX/releases)
Install pivx core wallet by untar/unzipping the file and running the install-params file
run `/bin/pivxd -daemon`
(set up a restarting instance with systemd https://docs.pivx.org/wallets/pivx-core-wallet/pivx-as-a-service-linux)
create a file in ~/.pivx/pivx.conf   
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
If you have issues purge the package-lock and try again

Once you pivx Daemon syncs restart it so that it is using the settings from the config file

.env file:
```
APP_URL=
MODE=
WALLET_URL=
WALLET_PORT=
WALLET_USER=
WALLET_PASSWORD=
JWT_SECRET=
DISCORD_WEBHOOK_NEWGAME=
```

The Discord Webhook env format is `ID:TOKEN`, for example (with a fake ID:Token pair):
`DISCORD_WEBHOOK_NEWGAME=9127598635710559730:0OduM5blLjRS309zzz4pQhINBFhTd-16VDzqrUS5JlqHth7cWRI5Q7uvyCzApXzhT47Y`

If omitted, the Discord Webhook will simply be disabled.

---

I recommend the latest version of node

# Running it
## development
` npm run dev `
or
` node index.js `
## production
` npm run build `
