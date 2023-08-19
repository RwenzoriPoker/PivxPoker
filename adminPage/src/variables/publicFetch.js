import axios from "axios";

const baseURL =
  'http://mainnet.pivx.poker/api'
const staticURL = 'http://mainnet.pivx.poker';
// const baseURL = "http://localhost:7778/api";
// const staticURL = "http://localhost:7778";
const publicFetch = axios.create({
  baseURL,
});

export { publicFetch, baseURL, staticURL };