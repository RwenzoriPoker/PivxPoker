const unirest = require('unirest');
const crypto = require('crypto');
module.exports = (io, socket, users) => {
  // const typing = async () => { 
  //   if(socket.user)
  //     socket.to(socket.user.api_key).emit('typing', {
  //       username: socket.user.username,
  //     });
  //   // ...
  // };
  // const stopTyping = () => {
  //   if(socket.user)
  //     socket.to(socket.user.api_key).emit('stop typing', {
  //       username: socket.user.username,
  //     });
  // };

  /**
   * Socket event for when a new message occures
   * @param {*} room 
   * @param {*} message 
   */
  const newMessage = (room, message) => {
    console.log("-new message-")
    console.log(room)
    console.log(message)
    if(socket.user){      
      io.to(room).emit('chat:receive', {
        sender: {
          username:socket.user.username,
          id:socket.user.id},
        message
      });
    }
  };
  // socket.on('typing', typing);
  // socket.on('stop typing', stopTyping);
  socket.on('chat:send', newMessage);

};
