const unirest=require('unirest');

const USER = process.env.WALLET_USER;
const PASS = process.env.WALLET_PASSWORD;

const headers = {
  "content-type": "text/plain;"
};


const getNewAddress=async ()=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getnewaddress","params":[]}`;
    const respond=await unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;

};

const getNewShieldAddress=async ()=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getnewshieldaddress","params":[]}`;
    const respond=await unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;

};

const getTransaction=async (txid)=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"gettransaction","params":["${txid}"]}`;
    const respond=await unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;

};

const sendToAddress=async (address, amount)=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"sendtoaddress","params":["${address}", "${amount/100000000}"]}`;
    console.log(dataString);
    const respond=await unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;
}

const getTotalBalance=async (address, amount)=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"getbalance","params":[]}`;
    console.log(dataString);
    const respond=await unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;
}

const decodeRawTransactiontest=(rawtx)=>{
    var dataString = `{"jsonrpc":"1.0","id":"curltext","method":"decoderawtransaction","params":["${rawtx}"]}`;
    console.log(dataString);
    const respond= unirest.post(`http://${USER}:${PASS}@${process.env.WALLET_URL}:${process.env.WALLET_PORT}/`)
    .headers(headers).send(dataString);
    return respond;
}

module.exports={
    getNewAddress, getNewShieldAddress, getTransaction, sendToAddress, getTotalBalance, decodeRawTransactiontest
};