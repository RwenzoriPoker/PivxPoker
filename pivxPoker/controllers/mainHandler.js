const crypto = require('crypto');
const User = require('../models/user');

module.exports = (io, socket, tournaments, cashGames, sitGames, users) => {

  /**
   * This occures when a user is disconnected
   */
  const disconnectUser = () => {

    // for(let i=0;i<sitGames.length;i++){
    //   let n=-1;
    //   if((n=sitGames[i].players.findIndex(ele=>ele.id==socket.id))>-1){
    //     sitGames[i].players.splice(n,1);
    //     io.to(sitGames[i].roomId).emit('sit:leave');
    //   }
    // }
    for(let i=0;i<users.length;i++){
      if(users[i].socketId==socket.id){
        users.splice(i,1);
      }
    }
    
   
  };

  /**
   * This is the main setter for giving information to the client about games when seen from the lobby pages
   * @param {object} callback 
   */
  const getLobby=async (callback) => {    
    callback({
      tournaments: tournaments.map((ele)=>{
        const item={};
        item.id=ele.id;
        item.name=ele.name;
        item.blindSchedule=ele.blindSchedule;
        item.buyIn=ele.buyIn;
        item.tableSize=ele.tableSize;
        item.startingStack=ele.startingStack;
        item.firstPlace=ele.firstPlace;
        item.secondPlace=ele.secondPlace;
        item.thirdPlace=ele.thirdPlace;
        item.turnTime = ele.turnTime;
        item.privacy = ele.privacy;
        item.playersCount = ele.players.filter((ele1) => ele1 != null).length;
        item.players= ele.players.filter((ele1) => ele1 != null).map((ele1) => ele1.user.id);
        item.limit=ele.limit;
        item.playing=ele.playing;
        return item;
      }),
      cashGames: cashGames.map((ele)=>{
        const item={};
        item.id=ele.id;
        item.name=ele.name;
        item.blinds=ele.blinds;
        item.buyIn=ele.buyIn;
        item.tableSize=ele.tableSize;
        item.turnTime = ele.turnTime;
        item.privacy = ele.privacy;
        item.playersCount = ele.players.filter((ele1) => ele1 != null).length;
        item.players= ele.players.filter((ele1) => ele1 != null).map((ele1) => ele1.user.id);
        item.limit=ele.limit;
        return item;
      }),
      sitGames: sitGames.map((ele)=>{
        const item={};
        item.id=ele.id;
        item.name=ele.name;
        item.blindSchedule=ele.blindSchedule;
        item.buyIn=ele.buyIn;
        item.tableSize=ele.tableSize;
        item.startingStack=ele.startingStack;
        item.firstPlace=ele.firstPlace;
        item.secondPlace=ele.secondPlace;
        item.thirdPlace=ele.thirdPlace;
        item.turnTime = ele.turnTime;
        item.privacy = ele.privacy;
        item.playersCount = ele.players.filter((ele1) => ele1 != null).length;
        item.players= ele.players.filter((ele1) => ele1 != null).map((ele1) => ele1.user.id);
        item.limit=ele.limit;
        item.playing=ele.playing;
        return item;
      }),
      pivx:socket.user ? socket.user.pivx : 0
    });
  };

  
  socket.on('disconnect', disconnectUser);

  socket.on('lobby', getLobby);
};
