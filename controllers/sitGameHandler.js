const crypto = require('crypto');
const User = require('../models/user');
const SitGame = require('../models/sitGame');
const constants = require('../utils/constants');
const { generateServerSeed, sha256, generateCards } = require('../utils/fair');
const Card = require('../utils/cards');
const solver = require('../utils/solver');
const fs = require("fs");
var sitRakes;
try {
  const jsonString = fs.readFileSync(__dirname+"/../uploads/configs/sitRakes.json");
  sitRakes = JSON.parse(jsonString);
} catch (err) {
  console.log(err);
  return;
}


const ranks=[
  "a High Card",
  "a Pair",
  "Two Pairs",
  "Three Kinds",
  "a Straight",
  "a Flush",
  "a Full House",
  "Four Kinds",
  "a Straight Flush",
  "a Royal Flush"
];

function valueCompare(top, player){
  if(top.length==0)
    return 1;
  let aa=0;
  for(let i=0;i<top.length;i++){
    if(player[i]>top[i])
      return 1;
    else if(player[i]<top[i])
      aa=-1;
  }
  return aa;
}



function allowedBet(sitGame, position) {
  const players = sitGame.players;
  let minRaise, maxRaise, call, status;
  if (!sitGame.limit) {
    minRaise = sitGame.bet + sitGame.raise;
    minRaise=minRaise!=0 ? minRaise : (sitGame.blinds==2 ? 5 : sitGame.blinds*2);
    maxRaise = players[position].balance + players[position].bet;
  } else {
    minRaise = sitGame.bet * 2 - players[position].bet;
    minRaise=minRaise!=0 ? minRaise : (sitGame.blinds==2 ? 5 : sitGame.blinds*2);
    maxRaise =
      sitGame.pot +
      players.reduce((total, ele) => total + ele.bet) +
      2 * sitGame.bet -
      players[position].bet;
  }
  if (sitGame.bet >= players[position].balance + players[position].bet) {
    //allIn only
    call = players[position].balance + players[position].bet;
    status = 'allIn';
    minRaise = null;
    maxRaise = null;
  } else if (minRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_minRaise';
    minRaise = players[position].balance + players[position].bet;
    minRaise=minRaise!=0 ? minRaise : (sitGame.blinds==2 ? 5 : sitGame.blinds*2);
    call = sitGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else if (maxRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_maxRaise';
    minRaise = minRaise;
    minRaise=minRaise!=0 ? minRaise : (sitGame.blinds==2 ? 5 : sitGame.blinds*2);
    call = sitGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else {
    status = 'allIn_no';
    minRaise = minRaise;
    minRaise=minRaise!=0 ? minRaise : (sitGame.blinds==2 ? 5 : sitGame.blinds*2);
    call = sitGame.bet;
    maxRaise = maxRaise;
  }
  return {
    minRaise,
    maxRaise,
    call,
    status
  };
}

function createValidation(data) {
  //validation for create table

  if (!data.name || data.name == '') return false;
  if (data.name.length<3 || data.name.length>15) return false;
  if (data.blindSchedule < 0 || data.blindSchedule > 4) return false;
  if (data.buyIn < 100) return false;
  if (!constants.turnTimeList.includes(data.turnTime)) return false;
  if (!constants.startingStackList.includes(data.startingStack)) return false;
  if (!constants.sitTableSizeList.includes(data.tableSize)) return false;
  return true;
}

function filterTableToShow(sitGame, socket, open = false) {
  //filter table data to show to the players
  const data = { ...sitGame, playTimeOut: null, blindTimeOut: null };
  data.players = data.players.map((ele) => {
    if (open) {
      if (ele != null) {
        let item = { ...ele, playTimeOut: null };
        return item;
      } else return null;
    } else {
      if (socket != null && socket.user && ele != null && ele.user.id == socket.user.id) {
        let item = { ...ele, playTimeOut: null };
        return item;
      } else if (ele != null) {
        let item = { ...ele, playTimeOut: null };
        if (item) {
          delete item.behavior;
          if (ele.cards && ele.cards.length == 2) item.cards = [0, 0];
          const user = {
            id: item.user.id,
            username: item.user.username,
            avatar: item.user.avatar,
            pivx: item.user.pivx
          };
          item.user = user;
        }
        return item;
      } else return ele;
    }
  });
  delete data.serverSeed;
  delete data.cards;
  delete data.password;
  return data;
}

function filterTableForLobby(sitGames) {
  //filter table to show in the lobby
  const filteredGames = sitGames.map((ele) => {
    const item = {};
    item.id = ele.id;
    item.name = ele.name;
    item.blindSchedule = ele.blindSchedule;
    item.buyIn = ele.buyIn;
    item.tableSize = ele.tableSize;
    item.startingStack = ele.startingStack;
    item.firstPlace = ele.firstPlace;
    item.secondPlace = ele.secondPlace;
    item.thirdPlace = ele.thirdPlace;
    item.turnTime = ele.turnTime;
    item.privacy = ele.privacy;
    item.playersCount = ele.players.filter((ele1) => ele1 != null).length;
    item.players = ele.players.filter((ele1) => ele1 != null).map((ele1) => ele1.user.id);
    item.limit = ele.limit;
    item.playing = ele.playing;
    return item;
  });
  return filteredGames;
}

function getNextPlayer(sitGame, position, stop = true) {
  //dealer==false => players.bet==game.bet->nextRound
  //true=> get newPostion
  let players = sitGame.players;
  let newPosition = -1;
  for (let i = 1; i < players.length; i++) {
    const nextPlayer = players[(i + position) % players.length];

    if ((i + position) % players.length == sitGame.dealerNext && stop) sitGame.dealerPassed = true;
    if ((i + position) % players.length == sitGame.bigBlindNext && stop)
      sitGame.bigBlindPassed = true;
    if (
      nextPlayer == null ||
      nextPlayer.allIn ||
      nextPlayer.fold ||
      (stop && nextPlayer.stand) ||
      nextPlayer.balance == 0
    )
      continue;
    if (
      nextPlayer.bet == sitGame.bet &&
      sitGame.bigBlindPassed &&
      sitGame.tableCards.length < 2 &&
      stop
    ) {
      newPosition = -1;
      break;
    } else if (
      nextPlayer.bet == sitGame.bet &&
      sitGame.dealerPassed &&
      sitGame.tableCards.length > 2 &&
      stop
    ) {
      newPosition = -1;
      break;
    } else {
      newPosition = (i + position) % players.length;
      break;
    }
  }
  return newPosition;
}

function sharePlayerCards(sitGame) {
  if (!sitGame.cardNo) sitGame.cardNo = 0;
  for (let i = 0; i < sitGame.players.length; i++) {
    if (sitGame.players[i] == null) continue;
    sitGame.players[i].cards = [sitGame.cards[sitGame.cardNo], sitGame.cards[sitGame.cardNo + 1]];
    sitGame.cardNo += 2;
  }
}

module.exports = (io, socket, sitGames) => {
  async function removeSitGame(id) {
    console.log('remove game');
    //TimeOut and remove game
    const index = sitGames.findIndex((ele) => (ele.id = id));
    const sitGame = sitGames[index];
    clearTimeout(sitGame.playTimeOut);
    clearTimeout(sitGame.blindTimeOut);
    for (let i = 0; i < sitGame.players.length; i++) {
      const player = sitGame.players[i];
      if (player != null) {
        try {
          const user=await User.findByIdAndUpdate(player.user.id, {
            $inc: {
              pivx: sitGame.buyIn
            }
          },{new:true});
        } catch (e) {
          console.log(e);
        }
      }
    }
    const sitGameDB = await SitGame.findById(sitGame.id);
    sitGameDB.closed = true;
    await sitGameDB.save();
    sitGames.splice(index, 1);
    io.emit('sit:lobby', {
      sitGames: filterTableForLobby(sitGames)
    });
    io.to(sitGame.roomId).emit('sit:closed');
  }
  function calcResult(sitGame) {
    //written words in the table - player won xx chips with xxxxx
    let winner='', result='';
    //init
    for (let i = 0; i < sitGame.players.length; i++) {
      const player = sitGame.players[i];
      if (player != null) {
        player.turn = false;
        sitGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        clearTimeout(player.playTimeOut);
      }
    }

    io.to(sitGame.roomId).emit('sit:open', filterTableToShow(sitGame, null, true));
    //compare the result
    let players = sitGame.players;
    const top = { rank: 0, value: 0, value2: 0, index: [] };
    for (let i = 0; i < players.length; i++) {
      if (players[i] == null || players[i].stand || players[i].fold) continue;
      const hands = [];
      hands.push(new Card(sitGame.tableCards[0]));
      hands.push(new Card(sitGame.tableCards[1]));
      hands.push(new Card(sitGame.tableCards[2]));
      hands.push(new Card(sitGame.tableCards[3]));
      hands.push(new Card(sitGame.tableCards[4]));
      hands.push(new Card(players[i].cards[0]));
      hands.push(new Card(players[i].cards[1]));
      players[i].result = solver(hands);
      if (top.rank < players[i].result.rank) {
        top.rank = players[i].result.rank;
        top.value = players[i].result.value;
        top.index = [i];
      

      } else if (
        top.rank == players[i].result.rank &&
        valueCompare(top.value, players[i].result.value)==1
      ) {
        top.rank = players[i].result.rank;
        top.value = players[i].result.value;
        top.index = [i];
      } else if( top.rank == players[i].result.rank &&
        valueCompare(top.value, players[i].result.value)==0){
        top.index.push(i);
      }
    }
    let totalWinBet = 0;
    let maxWinBet = 0;
    for (let i = 0; i < top.index.length; i++) {
      players[top.index[i]].win = true;
      players[top.index[i]].rank = top.rank;
      totalWinBet += players[top.index[i]].totalBet;
      maxWinBet =
        maxWinBet < players[top.index[i]].totalBet ? players[top.index[i]].totalBet : maxWinBet;
    }
    for (let i = 0; i < players.length; i++) {
      if (players[i] != null) {
        if (maxWinBet < players[i].totalBet) {
          players[i].balance += Math.floor(players[i].totalBet - maxWinBet);
          sitGame.pot -= players[i].totalBet - maxWinBet;
        }
      }
    }
    for (let i = 0; i < top.index.length; i++) {
      winner+=players[top.index[i]].user.username+", ";
      result="won "+Math.floor(
        (sitGame.pot * players[top.index[i]].totalBet) / totalWinBet
      )+" chips with "+ranks[players[top.index[i]].rank];
      players[top.index[i]].balance += Math.floor(
        (sitGame.pot * players[top.index[i]].totalBet) / totalWinBet
      );
    }
    winner=winner.substr(0, winner.length-2);
    sitGame.pot = 0;
    for (let i = 0; i < sitGame.players.length; i++) {
      const player = sitGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(sitGame.roomId).emit('sit:result', filterTableToShow(sitGame, null, true), winner, result);
    }, 1500);

    setTimeout(async () => {
      for (let i = 0; i < sitGame.players.length; i++) {
        const player = sitGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      const outPlayerNumbers = [];
      for (let i = 0; i < sitGame.players.length; i++) {
        player = sitGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(sitGame.players[i].user);
          outPlayerNumbers.push(i);
          sitGame.players[i] = null;
        }
      }
      if (sitGame.players.filter((ele) => ele != null).length == 1) {
        if (sitGame.firstPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(sitGame.firstPlace);
          financial.details = '1st Place';
          let bonus = Math.floor(sitGame.firstPlace /200);       
          try {
            const user=await User.findByIdAndUpdate(sitGame.players.find((ele) => ele != null).user.id, {
              $inc: {
                pivx: sitGame.firstPlace
              },
              $push: {
                financials: financial
              }
            }, {new:true});
            if (user.referrer && bonus > 0) {
              financial = {};
              financial.type = 'Bonus';
              financial.amount = bonus;
              const bonusData = {};
              bonusData.table = sitGame.id;
              bonusData.amount = bonus;
              bonusData.user = user.username;
              bonusData.game = 'SitGame';
              await User.findOneAndUpdate(
                { username: user.referrer },
                {
                  $inc: {
                    pivx: bonus
                  },
                  $push: {
                    financials: financial,
                    bonus: bonusData
                  }
                }
              );
            }

          } catch (e) {
            console.log(e);
          }
        }
        if (sitGame.secondPlace + sitGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(
            (sitGame.secondPlace + sitGame.thirdPlace) / outPlayers.length
          );
          financial.details = '2nd Place';
          let bonus=Math.floor(financial.amount/200);
          try {
            for (let i = 0; i < outPlayers.length; i++) {
              const user=await User.findByIdAndUpdate(outPlayers[i].id, {
                $inc: {
                  pivx: financial.amount
                },
                $push: {
                  financials: financial
                }
              }, {new:true});
              if (user.referrer && bonus > 0) {
                financial = {};
                financial.type = 'Bonus';
                financial.amount = bonus;
                const bonusData = {};
                bonusData.table = sitGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'SitGame';
                await User.findOneAndUpdate(
                  { username: user.referrer },
                  {
                    $inc: {
                      pivx: bonus
                    },
                    $push: {
                      financials: financial,
                      bonus: bonusData
                    }
                  }
                );
              }
            }
          } catch (e) {
            console.log(e);
          }
          io.to(sitGame.roomId).emit('sit:second', outPlayerNumbers);
        } else io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);

        io.to(sitGame.roomId).emit(
          'sit:first',
          sitGame.players.findIndex((ele) => ele != null)
        );
        //finish the sit game
        const sitGameDB = await SitGame.findById(sitGame.id);
        sitGameDB.closed = true;
        await sitGameDB.save();
        clearTimeout(sitGame.playTimeOut);
        clearTimeout(sitGame.blindTimeOut);
        sitGames.splice(
          sitGames.findIndex((ele) => ele.id == sitGame.id),
          1
        );
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        return;
      } else if (sitGame.players.filter((ele) => ele != null).length == 2) {
        if (sitGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(sitGame.secondPlace / outPlayers.length);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '3rd Place';
          sitGame.thirdPlace=0;
          try {
            for (let i = 0; i < outPlayers.length; i++) {
              const user=await User.findByIdAndUpdate(outPlayers[i].id, {
                $inc: {
                  pivx: financial.amount
                },
                $push: {
                  financials: financial
                }
              }, {new:true});
              if (user.referrer && bonus > 0) {
                financial = {};
                financial.type = 'Bonus';
                financial.amount = bonus;
                const bonusData = {};
                bonusData.table = sitGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'SitGame';
                await User.findOneAndUpdate(
                  { username: user.referrer },
                  {
                    $inc: {
                      pivx: bonus
                    },
                    $push: {
                      financials: financial,
                      bonus: bonusData
                    }
                  }
                );
              }
            }
          } catch (e) {
            console.log(e);
          }
          io.to(sitGame.roomId).emit('sit:third', outPlayerNumbers);
        } else io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(sitGame);
        }, 4500);
      } else {
        io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(sitGame);
        }, 4500);
      }
    }, 3000);
  }
  function endGame(sitGame) {
    //when only one or 0 players left
    //init
    console.log('end game');
    for (let i = 0; i < sitGame.players.length; i++) {
      const player = sitGame.players[i];
      if (player != null) {
        player.turn = false;
        sitGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        player.cards = null;
        clearTimeout(player.playTimeOut);
      }
    }
    sitGame.tableCards = [];
    io.to(sitGame.roomId).emit('sit:open', filterTableToShow(sitGame, null, true));
    let players = sitGame.players;
    let winner, maxWinBet;
    if (players.filter((ele) => ele != null && !ele.stand && !ele.fold).length == 1) {
      winner = players.find((ele) => ele != null && !ele.stand && !ele.fold);
      winner.win = true;
      winner.rank = 10;
      maxWinBet = winner.totalBet;
      for (let i = 0; i < players.length; i++) {
        if (players[i] != null) {
          if (maxWinBet < players[i].totalBet) {
            players[i].balance += Math.floor(players[i].totalBet - maxWinBet);
            sitGame.pot -= players[i].totalBet - maxWinBet;
          }
        }
      }
      winner.balance += Math.floor(sitGame.pot);
    }
    sitGame.pot = 0;

    for (let i = 0; i < sitGame.players.length; i++) {
      const player = sitGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(sitGame.roomId).emit('sit:result', filterTableToShow(sitGame, null, true));
    }, 1000);

    setTimeout(async () => {
      for (let i = 0; i < sitGame.players.length; i++) {
        const player = sitGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      const outPlayerNumbers = [];
      for (let i = 0; i < sitGame.players.length; i++) {
        player = sitGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(sitGame.players[i].user);
          outPlayerNumbers.push(i);
          sitGame.players[i] = null;
        }
      }
      if (sitGame.players.filter((ele) => ele != null).length == 1) {
        if (sitGame.firstPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(sitGame.firstPlace);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '1st Place';
          try {
            const user=await User.findByIdAndUpdate(sitGame.players.find((ele) => ele != null).user.id, {
              $inc: {
                pivx: sitGame.firstPlace
              },
              $push: {
                financials: financial
              }
            }, {new:true});
            if (user.referrer && bonus > 0) {
              financial = {};
              financial.type = 'Bonus';
              financial.amount = bonus;
              const bonusData = {};
              bonusData.table = sitGame.id;
              bonusData.amount = bonus;
              bonusData.user = user.username;
              bonusData.game = 'SitGame';
              await User.findOneAndUpdate(
                { username: user.referrer },
                {
                  $inc: {
                    pivx: bonus
                  },
                  $push: {
                    financials: financial,
                    bonus: bonusData
                  }
                }
              );
            }
          } catch (e) {
            console.log(e);
          }
        }
        if (sitGame.secondPlace + sitGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(
            (sitGame.secondPlace + sitGame.thirdPlace) / outPlayers.length
          );
          let bonus=Math.floor(financial.amount/200);
          financial.details = '2nd Place';
          try {
            for (let i = 0; i < outPlayers.length; i++) {
              const user=await User.findByIdAndUpdate(outPlayers[i].id, {
                $inc: {
                  pivx: financial.amount
                },
                $push: {
                  financials: financial
                }
              }, {new:true});
              if (user.referrer && bonus > 0) {
                financial = {};
                financial.type = 'Bonus';
                financial.amount = bonus;
                const bonusData = {};
                bonusData.table = sitGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'SitGame';
                await User.findOneAndUpdate(
                  { username: user.referrer },
                  {
                    $inc: {
                      pivx: bonus
                    },
                    $push: {
                      financials: financial,
                      bonus: bonusData
                    }
                  }
                );
              }
            }
          } catch (e) {
            console.log(e);
          }
          io.to(sitGame.roomId).emit('sit:second', outPlayerNumbers);
        } else io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);

        io.to(sitGame.roomId).emit(
          'sit:first',
          sitGame.players.findIndex((ele) => ele != null)
        );
        //finish the sit game

        const sitGameDB = await SitGame.findById(sitGame.id);
        sitGameDB.closed = true;
        await sitGameDB.save();
        clearTimeout(sitGame.playTimeOut);
        clearTimeout(sitGame.blindTimeOut);
        sitGames.splice(
          sitGames.findIndex((ele) => ele.id == sitGame.id),
          1
        );
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        return;
      } else if (sitGame.players.filter((ele) => ele != null).length == 2) {
        if (sitGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(sitGame.secondPlace / outPlayers.length);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '3rd Place';
          sitGame.thirdPlace=0;
          try {
            for (let i = 0; i < outPlayers.length; i++) {
              const user=await User.findByIdAndUpdate(outPlayers[i].id, {
                $inc: {
                  pivx: financial.amount
                },
                $push: {
                  financials: financial
                }
              }, {new:true});
              if (user.referrer && bonus > 0) {
                financial = {};
                financial.type = 'Bonus';
                financial.amount = bonus;
                const bonusData = {};
                bonusData.table = sitGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'SitGame';
                await User.findOneAndUpdate(
                  { username: user.referrer },
                  {
                    $inc: {
                      pivx: bonus
                    },
                    $push: {
                      financials: financial,
                      bonus: bonusData
                    }
                  }
                );
              }
            }
          } catch (e) {
            console.log(e);
          }
          io.to(sitGame.roomId).emit('sit:third', outPlayerNumbers);
        } else io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(sitGame);
        }, 1500);
      } else {
        io.to(sitGame.roomId).emit('sit:playersOut', outPlayerNumbers);
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(sitGame);
        }, 1500);
      }
    }, 1000);
  }

  function nextCard(sitGame) {
    console.log('next card');
    //init
    sitGame.dealerPassed = false;
    sitGame.bigBlindPassed = false;
    const players = sitGame.players;
    sitGame.raise = 0;
    sitGame.bet = 0;
    //gather to pot
    for (let i = 0; i < players.length; i++) {
      if (players[i] != null) {
        sitGame.pot += players[i].bet;
        players[i].totalBet += players[i].bet;
        players[i].bet = 0;
      }
    }
    //open table cards
    if (sitGame.tableCards.length == 0) {
      console.log('3 cards open');
      sitGame.tableCards.push(sitGame.cards[sitGame.cardNo]);
      sitGame.cardNo++;
      sitGame.tableCards.push(sitGame.cards[sitGame.cardNo]);
      sitGame.cardNo++;
      sitGame.tableCards.push(sitGame.cards[sitGame.cardNo]);
      sitGame.cardNo++;      
    } else if (sitGame.tableCards.length < 5) {
      console.log('next card open');
      sitGame.tableCards.push(sitGame.cards[sitGame.cardNo]);
      sitGame.cardNo++;      
    } else {
      console.log('result');
      calcResult(sitGame);
      return;
    }
      setTimeout(()=>{

      io.to(sitGame.roomId).emit('sit:card', {
        tableCards: sitGame.tableCards,
        pot: sitGame.pot
      });
      if (players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2) {
        endGame(sitGame);
        return;
      } else if (
        players.filter((ele) => ele != null && !ele.stand && !ele.fold && !ele.allIn).length < 2
      ) {
        nextCard(sitGame);
        return;
      }

      let position = sitGame.dealerNext;
      if (
        players[position].allIn ||
        players[position].fold ||
        players[position].stand ||
        players[position].balance == 0
      ) {
        position = getNextPlayer(sitGame, position);
      }

      if (position < 0) {
        nextCard(sitGame);
        return;
      }
      players[position].turn = true;
      players[position].turnTime = 0;
      players[position].playTimeOut = setTimeout(
        turnTimeOut,
        sitGame.turnTime * 10,
        sitGame,
        position
      );
      sitGame.allowedBet = allowedBet(sitGame, position);
      io.to(sitGame.roomId).emit('sit:turn', {
        position,
        time: 0,
        amount: sitGame.allowedBet
      });
    },1500);
  }

  function nextTurn(sitGame, position) {
    const players = sitGame.players;
    let newPosition = getNextPlayer(sitGame, position);
    if (newPosition < 0) {
      //next card
      if (players[position] != null) players[position].turn = false;
      nextCard(sitGame);
      return;
    } else {
      //turn out
      if (players[position] != null) players[position].turn = false;
      if (
        players[newPosition].bet >= sitGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2
      ) {
        endGame(sitGame);
        return;
      } else if (
        players[newPosition].bet >= sitGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold && !ele.allIn).length < 2
      ) {
        nextCard(sitGame);
        return;
      }
      players[newPosition].turn = true;
      players[newPosition].turnTime = 0;
      players[newPosition].playTimeOut = setTimeout(
        turnTimeOut,
        sitGame.turnTime * 10,
        sitGame,
        newPosition
      );
      sitGame.allowedBet = allowedBet(sitGame, newPosition);
      io.to(sitGame.roomId).emit('sit:turn', {
        position: newPosition,
        time: 0,
        amount: sitGame.allowedBet
      });
    }
  }

  function standPlayer(sitGame, position) {
    sitGame.players[position].stand = true;
    sitGame.players[position].turn = false;
    sitGame.players[position].cards = null;
    sitGame.pot += sitGame.players[position].bet;
    sitGame.players[position].bet = 0;
    sitGame.players[position].totalBet = 0;
    io.to(sitGame.roomId).emit('sit:stand', {
      position
    });
  }
  function prepareSitGame(sitGame) {
    sitGame.ready--;
    io.to(sitGame.roomId).emit('sit:ready', {
      time: sitGame.ready
    });
    if (sitGame.ready <= 0) {
      setFirstRound(sitGame);
    } else {
      setTimeout(prepareSitGame, 1000, sitGame);
    }
  }

  function setNextBlind(sitGame) {
    sitGame.blindStep++;
    sitGame.blinds = constants.sitBlindList[sitGame.blindSchedule][sitGame.blindStep].blinds;
    sitGame.blindTimeOut = setTimeout(
      setNextBlind,
      constants.sitBlindList[sitGame.blindSchedule][sitGame.blindStep].duration * 60 * 1000,
      sitGame
    );
  }

  function turnTimeOut(sitGame, position) {
    sitGame.players[position].turnTime += sitGame.turnTime * 10;
    const player = sitGame.players[position];
    if (player.behavior && 1000 <= player.turnTime) {
      bet(sitGame.players, position, sitGame.bet);
      io.to(sitGame.roomId).emit('sit:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: sitGame.pot
      });
      if (
        sitGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand)
          .length < 2
      ) {
        endGame(sitGame);
      } else {
        nextTurn(sitGame, position);
      }
    }else if (sitGame.turnTime * 1000 <= player.turnTime) {
      if (player.bet==sitGame.bet) {
        bet(sitGame.players, position, sitGame.bet);
      } else {
        standPlayer(sitGame, position);
      }

      io.to(sitGame.roomId).emit('sit:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: sitGame.pot
      });
      if (sitGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand).length < 2) {
        endGame(sitGame);
      } else {
        nextTurn(sitGame, position);
      }
    } else {
      io.to(sitGame.roomId).emit('sit:turn', {
        position,
        time: player.turnTime
      });
      player.playTimeOut = setTimeout(
        turnTimeOut,
        sitGame.turnTime * 10,
        sitGame,
        position
      );
    }
  }

  function bet(players, position, amount) {
    if (players[position] == null) return;
    if (players[position].balance <= amount) {
      players[position].bet += players[position].balance;
      players[position].balance = 0;
      players[position].allIn = true;
    } else {
      players[position].bet += amount;
      players[position].balance -= amount;
    }
  }

  function setFirstRound(sitGame) {
    sitGame.nonce =sitGame.nonce ?sitGame.nonce+1 : 0;
    sitGame.cards = generateCards(
      sitGame.serverSeed,
      sitGame.id + sitGame.name,
      sitGame.nonce,
      0,
      52
    );
    let players = sitGame.players;
    //init
    sitGame.tableCards = [];
    sitGame.dealerPassed = false;
    sitGame.bigBlindPassed = false;
    sitGame.pot = 0;
    
    sitGame.cardNo = 0;
    sitGame.players = sitGame.players.map((ele) => {
      if (ele != null) {
        const item = ele;
        item.turn = false;
        item.bet = 0;
        item.fold = false;
        item.allIn = false;
        item.behavior = false;
        item.totalBet = 0;
        item.win = null;
        item.rank = null;
        item.result;
        item.allIn = false;
        item.fold = false;
        return item;
      }
      return ele;
    });
    sitGame.blindStep = 0;
    sitGame.blinds = constants.sitBlindList[sitGame.blindSchedule][sitGame.blindStep].blinds;
    sitGame.blindTimeOut = setTimeout(
      setNextBlind,
      constants.sitBlindList[sitGame.blindSchedule][sitGame.blindStep].duration * 60 * 1000,
      sitGame
    );
    sitGame.bet = sitGame.blinds == 2 ? 5 : sitGame.blinds * 2;
    sitGame.raise = sitGame.blinds == 2 ? 5 : sitGame.blinds * 2;
    console.log('init');
    //share the cards
    sharePlayerCards(sitGame);
    //find dealer
    let position = 0;
    sitGame.dealer = position;
    if (players.filter((ele) => ele != null).length == 2) {
      bet(players, position, sitGame.blinds);

      //Big Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.dealerNext = position;
      sitGame.bigBlind = position;
      bet(players, position, sitGame.blinds == 2 ? 5 : sitGame.blinds * 2);
      sitGame.bigBlindNext = getNextPlayer(sitGame, position, false);
    } else {
      //small Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.dealerNext = position;
      bet(players, position, sitGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.bigBlind = position;
      bet(players, position, sitGame.blinds == 2 ? 5 : sitGame.blinds * 2);
      sitGame.bigBlindNext = getNextPlayer(sitGame, position, false);
    }
    console.log('started');
    io.to(sitGame.roomId).emit('sit:start', {
      sitGame: filterTableToShow(sitGame, null)
    });
    position = getNextPlayer(sitGame, position, false);
    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      sitGame.turnTime * 10,
      sitGame,
      position
    );

    sitGame.allowedBet = allowedBet(sitGame, position);
    io.to(sitGame.roomId).emit('sit:turn', {
      position,
      time: 0,
      amount: sitGame.allowedBet
    });
  }

  function setNextRound(sitGame) {
    sitGame.nonce++;
    sitGame.cards = generateCards(
      sitGame.serverSeed,
      sitGame.id + sitGame.name,
      sitGame.nonce,
      0,
      52
    );
    let players = sitGame.players;
    //init
    players = players.map((ele) => {
      if (ele != null) {
        ele.totalBet = 0;
        ele.bet = 0;
        ele.cards = null;
        ele.behavior = false;
        ele.win = null;
        ele.rank = null;

        ele.result;
      }
      return ele;
    });
    sitGame.pot = 0;
    sitGame.bet = sitGame.blinds == 2 ? 5 : sitGame.blinds * 2;
    sitGame.raise = sitGame.blinds == 2 ? 5 : sitGame.blinds * 2;
    sitGame.bigBlindPassed = false;
    sitGame.dealerPassed = false;
    sitGame.cardNo = 0;
    sitGame.tableCards = [];
    //share the cards
    sharePlayerCards(sitGame);
    let position = getNextPlayer(sitGame, sitGame.dealer, false);
    sitGame.dealer = position;
    if (
      players.filter((ele) => ele != null && ele.allIn == false && ele.fold == false).length == 2
    ) {
      bet(players, position, sitGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.dealerNext = position;
      sitGame.bigBlind = position;
      bet(players, position, sitGame.blinds == 2 ? 5 : sitGame.blinds * 2);
      position = getNextPlayer(sitGame, position, false);
      sitGame.bigBlindNext = position;
    } else {
      //small Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.dealerNext = position;

      bet(players, position, sitGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(sitGame, position, false);
      sitGame.bigBlind = position;

      bet(players, position, sitGame.blinds == 2 ? 5 : sitGame.blinds * 2);
      position = getNextPlayer(sitGame, position, false);
      sitGame.bigBlindNext = position;
    }
    io.to(sitGame.roomId).emit('sit:start', {
      sitGame: filterTableToShow(sitGame, null)
    });

    if (players[position] == null || players[position].stand) {
      nextTurn(sitGame, position);
      return;
    }
    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      sitGame.turnTime * 10,
      sitGame,
      position
    );
    sitGame.allowedBet = allowedBet(sitGame, position);
    io.to(sitGame.roomId).emit('sit:turn', {
      position,
      time: 0,
      amount: sitGame.allowedBet
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //socket event functions
  const createGame = async (data, callback) => {
    if (!socket.user) {
      callback({
        message: 'Please signin and retry later!',
        status: false
      });
      return;
    } else if (socket.user.pivx < 100 || socket.user.pivx < data.buyIn) {
      callback({
        message: 'Not enough balance to create a game!',
        status: false
      });
      return;
    }
    if (!createValidation(data)) {
      callback({
        message: 'Data error!',
        status: false
      });
      return;
    }
    if (sitGames.find((ele) => ele.name == data.name)) {
      callback({
        message: 'Table Name is already taken!',
        status: false
      });
      return;
    }

    let rake=3;
    for(let i=0;i<sitRakes.length-1;i++){
      if(data.buyIn>=sitRakes[i].buyIn && data.buyIn<sitRakes[i+1].buyIn){
        rake=sitRakes[i].rake;
        break;
      }else if(data.buyIn>=sitRakes[sitRakes.length-1].buyIn){
        rake=sitRakes[sitRakes.length-1].rake;
      }
    }
    console.log('rake='+rake);
    if(data.firstPlace+data.secondPlace+data.thirdPlace>data.buyIn*data.tableSize*(100-rake)/100){
      callback({
        message: 'Prize is more than the amount of buyIn!',
        status: false
      });
      return;
    }
    const sitGame = data;
    const sitGameDB = new SitGame();
    sitGameDB.name = data.name;
    sitGameDB.blindsSchedule = data.blindSchedule;
    sitGameDB.stack = data.startingStack;
    sitGameDB.first = data.firstPlace;
    sitGameDB.second = data.secondPlace;
    sitGameDB.third = data.thirdPlace;
    sitGameDB.seats = data.tableSize;
    sitGameDB.buyIn=data.buyIn;
    sitGameDB.serverSeed = generateServerSeed();
    await sitGameDB.save();
    sitGame.id = sitGameDB.id;

    sitGame.roomId = 'sit_' + sitGame.id;
    sitGame.creator = { id: socket.id, username: socket.user.username };
    sitGame.playing = false;
    sitGame.tableCards = [];
    sitGame.pot = 0;
    sitGame.bet = 0;
    sitGame.raise = 0;
    sitGame.playTimeOut = null;
    sitGame.players = [];
    sitGame.serverSeed = sitGameDB.serverSeed;
    sitGame.serverHash = sha256(sitGame.serverSeed);
    sitGame.cardNo = 0;
    sitGame.dealerPassed = false;
    sitGame.bigBlindPassed = false;
    sitGame.dealer = 0;
    const player = {
      avatar: socket.user.profilePhoto,
      id: socket.id,
      user: socket.user,
      cards: null,
      dealer: true,
      turn: false,
      balance: sitGame.startingStack,
      bet: 0,
      stand: false,
      fold: false,
      playTimeOut: null,
      behavior: false,
      ready: false
    };

    try {
      const user = await User.findByIdAndUpdate(
        socket.user.id,
        {
          $inc: {
            pivx: -sitGame.buyIn
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
    } catch (e) {
      console.log(e);
    }

    sitGame.players.push(player);

    sitGame.playTimeOut = setTimeout(removeSitGame, 
      1200*1000, sitGame.id);
    sitGames.push(sitGame);
    io.emit('sit:lobby', {
      sitGames: filterTableForLobby(sitGames)
    });
    callback({
      id: sitGame.id,
      pivx: socket.user.pivx,
      status: true
    });
  };

  const enterGame = async (id, callback) => {
    const sitGame = sitGames.find((ele) => ele.id == id);
    if (sitGame) {
      if (!socket.rooms.has('sit_' + id)) socket.join('sit_' + id);
      const data = filterTableToShow(sitGame, socket);
      callback({
        sitGame: data
      });
    }
  };

  const showMyCards = async (id, callback) => {
    const sitGame = sitGames.find((ele) => ele.id == id);
    if (sitGame) {
      callback({
        cards: sitGame.players.find((ele) => ele != null && ele.user.id == socket.user.id).cards
      });
    }
  };

  const joinGame = async (roomId, password, callback) => {
    console.log('join');
    const sitGame = sitGames.find((ele) => ele.id == roomId);
    if (!sitGame) {
      callback({
        message: 'There is no table!',
        status: false
      });
      return;
    }
    if (sitGame.playing) {
      callback({
        message: 'Already started!',
        status: false
      });
      return;
    }
    if (sitGame.players.length == sitGame.tableSize) {
      callback({
        message: 'No seat!',
        status: false
      });
      return;
    }
    if (!socket.user) {
      callback({
        message: 'Please signin and retry later!',
        status: false
      });
      return;
    } else if (socket.user.pivx < sitGame.buyIn) {
      callback({
        message: 'Not enough balance to join a table!',
        status: false
      });
      return;
    } else if (sitGame.privacy && password != sitGame.password) {
      callback({
        message: 'Wrong Password!',
        status: false
      });
      return;
    }
    let joined = sitGame.players.findIndex((ele) =>
      ele != null ? ele.user.id === socket.user.id : false
    );
    if (joined > -1) {
      try {
        const user = await User.findByIdAndUpdate(
          socket.user.id,
          {
            $inc: {
              pivx: sitGame.buyIn
            }
          },
          { new: true }
        );
        socket.user.pivx = user.pivx;
      } catch (e) {
        console.log(e);
      }
      sitGame.players.splice(joined, 1);
      io.emit('sit:lobby', {
        sitGames: filterTableForLobby(sitGames)
      });
      socket.to(sitGame.roomId).emit('sit:join', {
        sitGame: filterTableToShow(sitGame, null)
      });
      const data = filterTableToShow(sitGame, socket);
      callback({
        sitGame: data,
        pivx:socket.user.pivx,
        status: true
      });
      return;
    }
    socket.join('sit_' + roomId);

    const player = {
      avatar: socket.user.profilePhoto,
      id: socket.id,
      user: socket.user,
      cards: null,
      dealer: false,
      turn: false,
      balance: sitGame.startingStack,
      bet: 0,
      stand: false,
      fold: false,
      playTimeOut: null,
      behavior: false,
      ready: false,
      totalBet: 0
    };
    try {
      const user = await User.findByIdAndUpdate(
        socket.user.id,
        {
          $inc: {
            pivx: -sitGame.buyIn
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
    } catch (e) {
      console.log(e);
    }
    sitGame.players.push(player);

    io.emit('sit:lobby', {
      sitGames: filterTableForLobby(sitGames)
    });
    socket.to(sitGame.roomId).emit('sit:join', {
      sitGame: filterTableToShow(sitGame, null)
    });
    const data = filterTableToShow(sitGame, socket);

    callback({
      sitGame: data,
      status: true, 
      pivx:socket.user.pivx
    });

    if (sitGame.players.length == sitGame.tableSize) {
      //game start
      if (!sitGame.playing) {
        sitGame.playing = true;
        console.log(sitGames);
        io.emit('sit:lobby', {
          sitGames: filterTableForLobby(sitGames)
        });
        //game start
        sitGame.ready = 2;
        clearTimeout(sitGame.playTimeOut);
        setTimeout(prepareSitGame, 1000, sitGame);
      }
    }
  };

  const betGame = async (roomId, bet) => {
    const sitGame = sitGames.find((ele) => ele.id == roomId);
    if (!sitGame) {
      return;
    }
    const position = sitGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    const player = sitGame.players[position];
    clearTimeout(player.playTimeOut);
    player.playTimeOut = null;
    let raise = false,betStatus=false,
      call = false;
    if (player.turn && !player.stand && !player.fold && !player.allIn) {
      if (bet.status == 'fold') {
        sitGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;

        player.fold = true;
      } else if (bet.status == 'allIn') {
        if (sitGame.allowedBet.status == 'allIn_no') {
          player.balance -= Math.floor(sitGame.allowedBet.maxRaise - player.bet);
          player.bet = sitGame.allowedBet.maxRaise;
          sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
          raise = true;
        } else {
          player.allIn = true;
          player.bet += player.balance;
          player.balance = 0;
          if (!sitGame.limit)
            sitGame.raise =
              sitGame.raise < player.bet - sitGame.bet ? player.bet - sitGame.bet : sitGame.raise;
          sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
        }
      } else {
        if (bet.amount >= player.bet + player.balance) {
          if (sitGame.allowedBet.status == 'allIn_no') {
            raise = true;
            player.balance -= Math.floor(sitGame.allowedBet.maxRaise - player.bet);
            player.bet = sitGame.allowedBet.maxRaise;
            sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
          } else {
            player.allIn = true;
            player.bet += player.balance;
            player.balance = 0;

            if (!sitGame.limit)
              sitGame.raise =
                sitGame.raise < player.bet - sitGame.bet ? player.bet - sitGame.bet : sitGame.raise;
            sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
          }
        } else if (bet.amount < sitGame.bet) {
          sitGame.pot += player.bet;
          player.totalBet = player.bet;
          player.bet = 0;
          player.fold = true;
        } else if (bet.amount == sitGame.bet) {
          if (sitGame.bet > player.bet) call = true;
          player.balance -= Math.floor(sitGame.bet - player.bet);
          player.bet = sitGame.bet;
        } else {
          if (bet.amount < sitGame.allowedBet.minRaise) {
            if (sitGame.bet > player.bet) call = true;
            player.balance -= Math.floor(sitGame.bet - player.bet);
            player.bet = sitGame.bet;
          } else if (bet.amount > sitGame.allowedBet.maxRaise) {
            raise = true;
            bet.amount = sitGame.allowedBet.maxRaise;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!sitGame.limit)
              sitGame.raise =
                sitGame.raise < player.bet - sitGame.bet ? player.bet - sitGame.bet : sitGame.raise;
            sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
          } else {
            if(sitGame.bet==0 && player.bet==0){
              betStatus=true;
            }else
              raise = true;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!sitGame.limit)
              sitGame.raise =
                sitGame.raise < player.bet - sitGame.bet ? player.bet - sitGame.bet : sitGame.raise;
            sitGame.bet = sitGame.bet < player.bet ? player.bet : sitGame.bet;
          }
        }
      }
      io.to(sitGame.roomId).emit('sit:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: sitGame.pot,
        raise,
        call,
        betStatus
      });
      if (sitGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand).length < 2) {
        console.log('after bet, end Game');
        endGame(sitGame);
      } else {
        console.log('after bet, next turn');
        nextTurn(sitGame, position);
      }
    }
  };

  const behaviorGame = async (roomId, behavior, callback) => {
    const sitGame = sitGames.find((ele) => ele.id == roomId);
    if (!sitGame) {
      return;
    }
    const player = sitGame.players.find((ele) => ele != null && ele.user.id == socket.user.id);
    player.behavior = behavior;
    callback(behavior);
  };

  const standGame = async (roomId, callback) => {
    const sitGame = sitGames.find((ele) => ele.id == roomId);
    if (!sitGame) {
      return;
    }
    const position = sitGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position > -1) {
      const player = sitGame.players[position];
      player.stand = !player.stand;
      if (player.stand) {
        const turn = player.turn;
        player.turn = false;
        player.cards = null;
        sitGame.pot += player.bet;
        player.bet = 0;
        player.totalBet = 0;
        socket.to(sitGame.roomId).emit('sit:stand', {
          position
        });
        callback(true);
        // if (sitGame.players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2) {
        //   endGame(sitGame);
        //   return;
        // }
        if (turn) {
          clearTimeout(player.playTimeOut);
          nextTurn(sitGame, position);
        }
      } else {
        socket.to(sitGame.roomId).emit('sit:sit', {
          position
        });
        callback(player.stand);
      }
    }
  };

  const leaveGame = async (roomId, callback) => {
    const sitGame = sitGames.find((ele) => ele.id == roomId);
    if (!sitGame) {
      return;
    }
    const position = sitGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position > -1) {
      let player = sitGame.players[position];
      const turn = player.turn;

      sitGame.pot += player.bet;

      sitGame.players[position] = null;
      socket.to(sitGame.roomId).emit('sit:leave', {
        position
      });
      io.emit('sit:lobby', {
        sitGames: filterTableForLobby(sitGames)
      });
      callback(true);
      if (turn) {
        clearTimeout(player.playTimeOut);
        nextTurn(sitGame, position);
      }
    }
  };

  socket.on('sit:create', createGame);
  socket.on('sit:enter', enterGame);
  socket.on('sit:join', joinGame);
  socket.on('sit:bet', betGame);
  socket.on('sit:behavior', behaviorGame);
  socket.on('sit:stand', standGame);
  socket.on('sit:leave', leaveGame);

  socket.on('sit:showMyCards', showMyCards);
};
