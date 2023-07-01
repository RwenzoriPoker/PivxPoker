import io from "socket.io-client";

const socket = 'io("http://localhost:7777")';
// socket.on('connect', () => {
//     console.log("socket connected")
// })
// socket.on('connect_error', function (err) {
//     console.log(err)
// });

export { socket }