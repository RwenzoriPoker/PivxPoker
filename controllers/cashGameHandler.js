const crypto = require('crypto');

const User = require('../models/user');
const CashGame = require('../models/cashGame');
const constants = require('../utils/constants');
const { generateServerSeed, sha256, generateCards } = require('../utils/fair');
const Card = require('../utils/cards');
const solver = require('../utils/solver');

const fs = require('fs');
var cashRakes;
try {
  const jsonString = fs.readFileSync(__dirname + '/../uploads/configs/cashRakes.json');
  cashRakes = JSON.parse(jsonString);
} catch (err) {
  console.log(err);
  return;
}

const ranks = [
  'a High Card',
  'a Pair',
  'Two Pairs',
  'Three Kinds',
  'a Straight',
  'a Flush',
  'a Full House',
  'Four Kinds',
  'a Straight Flush',
  'a Royal Flush'
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



function allowedBet(cashGame, position) {
  const players = cashGame.players;
  let minRaise, maxRaise, call, status;
  if (!cashGame.limit) {
    minRaise = cashGame.bet + cashGame.raise;
    minRaise = minRaise != 0 ? minRaise : cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    maxRaise = players[position].balance + players[position].bet;
  } else {
    minRaise = cashGame.bet * 2 - players[position].bet;
    minRaise = minRaise != 0 ? minRaise : cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    maxRaise =
      cashGame.pot +
      players.reduce((total, ele) => total + ele.bet) +
      2 * cashGame.bet -
      players[position].bet;
  }
  if (cashGame.bet >= players[position].balance + players[position].bet) {
    //allIn only
    call = players[position].balance + players[position].bet;
    status = 'allIn';
    minRaise = null;
    maxRaise = null;
  } else if (minRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_minRaise';
    minRaise = players[position].balance + players[position].bet;
    minRaise = minRaise != 0 ? minRaise : cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    call = cashGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else if (maxRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_maxRaise';
    minRaise = minRaise;
    minRaise = minRaise != 0 ? minRaise : cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    call = cashGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else {
    status = 'allIn_no';
    minRaise = minRaise;
    minRaise = minRaise != 0 ? minRaise : cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    call = cashGame.bet;
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
  if (data.blinds * 50 > data.buyIn[0] || data.blinds * 500 < data.buyIn[0]) {
    // callback({
    //   message:"Buy in error!",
    //   status:false
    // });
    return;
  }
  if (data.blinds * 50 > data.buyIn[1] || data.blinds * 500 < data.buyIn[1]) {
    // callback({
    //   message:"Buy in error!",
    //   status:false
    // });
    return false;
  }
  if (!data.name || data.name == '') return false;
  if (data.name.length < 3 || data.name.length > 15) return false;
  if (!constants.blindsList.includes(data.blinds)) return false;
  if (!constants.turnTimeList.includes(data.turnTime)) return false;
  if (!constants.cashTableSizeList.includes(data.tableSize)) return false;
  if (!constants.maxTimeBankList.includes(data.maxTimeBank)) return false;
  return true;
}

function filterTableToShow(cashGame, socket, open = false) {
  //filter table data to show to the players
  const data = { ...cashGame, playTimeOut: null };
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
function filterPlayerToShow(player) {
  let item = { ...player, playTimeOut: null };
  delete item.behavior;
  if (item.cards != null) item.cards = [0, 0];
  const user = {
    id: item.user.id,
    username: item.user.username,
    avatar: item.user.avatar,
    pivx: item.user.pivx
  };
  item.user = user;
  return item;
}

function filterTableForLobby(cashGames) {
  //filter table to show in the lobby
  const filteredGames = cashGames.map((cashGame) => {
    const item = {};
    item.id = cashGame.id;
    item.name = cashGame.name;
    item.blinds = cashGame.blinds;
    item.buyIn = cashGame.buyIn;
    item.tableSize = cashGame.tableSize;
    item.playersCount = cashGame.players.filter((ele) => ele != null).length;
    item.players = cashGame.players.filter((ele) => ele != null).map((ele) => ele.user.id);
    item.turnTime = cashGame.turnTime;
    item.privacy = cashGame.privacy;
    item.limit = cashGame.limit;
    return item;
  });
  return filteredGames;
}

function getNextPlayer(cashGame, position, stop = true) {
  //dealer==false => players.bet==game.bet->nextRound
  //true=> get newPostion
  let players = cashGame.players;
  let newPosition = -1;
  for (let i = 1; i < players.length; i++) {
    const nextPlayer = players[(i + position) % players.length];

    if ((i + position) % players.length == cashGame.dealerNext && stop)
      cashGame.dealerPassed = true;
    if ((i + position) % players.length == cashGame.bigBlindNext && stop)
      cashGame.bigBlindPassed = true;
    if (
      nextPlayer == null ||
      nextPlayer.allIn ||
      !nextPlayer.ready ||
      nextPlayer.fold ||
      nextPlayer.stand ||
      nextPlayer.balance == 0
    )
      continue;
    if (
      nextPlayer.bet == cashGame.bet &&
      cashGame.bigBlindPassed &&
      cashGame.tableCards.length < 2 &&
      stop
    ) {
      newPosition = -1;
      break;
    } else if (
      nextPlayer.bet == cashGame.bet &&
      cashGame.dealerPassed &&
      cashGame.tableCards.length > 2 &&
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

function sharePlayerCards(cashGame) {
  if (!cashGame.cardNo) cashGame.cardNo = 0;
  for (let i = 0; i < cashGame.players.length; i++) {
    if (cashGame.players[i] == null || !cashGame.players[i].ready) continue;
    cashGame.players[i].cards = [
      cashGame.cards[cashGame.cardNo],
      cashGame.cards[cashGame.cardNo + 1]
    ];
    cashGame.cardNo += 2;
  }
}

module.exports = (io, socket, cashGames) => {
  async function removeCashGame(id) {
    //TimeOut and remove game
    const index = cashGames.findIndex((ele) => (ele.id = id));
    const cashGame = cashGames[index];
    console.log('remove game');
    // console.log(cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake);
    clearTimeout(cashGame.playTimeOut);
    if (cashGame.players.filter((ele) => ele != null && !ele.stand && ele.ready) > 1) {
      return;
    }
    let alive = -1;
    for (let i = 0; i < cashGame.players.length; i++) {
      const player = cashGame.players[i];
      cashGame.pot += player != null ? player.bet : 0;
      if (player != null && !player.fold && !player.stand && player.ready && player.bet > 0)
        alive = i;
      if (player != null) {
        let win = player.balance - player.originBalance;
        let bonus = win > 0 ? Math.floor(win / ((100 - cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake)*2)) : 0;       
        let financial = {};
        financial.type = 'Game';
        financial.amount = win;
        try {
          const user = await User.findByIdAndUpdate(player.user.id, {
            $inc: {
              pivx: win + player.originBalance
            },
            $push: {
              financials: financial
            }
          });
          if (user.referrer && bonus > 0) {
            financial = {};
            financial.type = 'Bonus';
            financial.amount = bonus;
            const bonusData = {};
            bonusData.table = cashGame.id;
            bonusData.amount = bonus;
            bonusData.user = user.username;
            bonusData.game = 'CashGame';
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
    }
    if (alive > -1) {
      let financial = {};
      financial.type = 'Game';
      financial.amount = Math.floor(
        (cashGame.pot * (100 - cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake)) / 100
      );
      let bonus = Math.floor(cashGame.pot / 200);
      if (financial.amount > 0) {
        try {
          const user = await User.findByIdAndUpdate(cashGame.players[alive].user.id, {
            $inc: {
              pivx: financial.amount
            },
            $push: {
              financials: financial
            }
          });
          if (user.referrer) {
            financial = {};
            financial.type = 'Bonus';
            financial.amount = bonus;
            const bonusData = {};
            bonusData.table = cashGame.id;
            bonusData.amount = bonus;
            bonusData.user = user.username;
            bonusData.game = 'CashGame';
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
    }
    const cashGameDB = await CashGame.findById(cashGame.id);
    cashGameDB.closed = true;
    await cashGameDB.save();
    cashGames.splice(index, 1);
    io.emit('cash:lobby', {
      cashGames: filterTableForLobby(cashGames)
    });

    io.to(cashGame.roomId).emit('cash:closed');
  }
  function calcResult(cashGame) {
    //written words in the table - player won xx chips with xxxxx
    let winner = '',
      result = '';
    //init
    for (let i = 0; i < cashGame.players.length; i++) {
      const player = cashGame.players[i];
      if (player != null) {
        player.turn = false;
        cashGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        clearTimeout(player.playTimeOut);
      }
    }

    io.to(cashGame.roomId).emit('cash:open', filterTableToShow(cashGame, null, true));
    //compare the result
    let players = cashGame.players;
    const top = { rank: 0, value: [], index: [] };
    for (let i = 0; i < players.length; i++) {
      if (players[i] == null || !players[i].ready || players[i].stand || players[i].fold) continue;
      const hands = [];
      hands.push(new Card(cashGame.tableCards[0]));
      hands.push(new Card(cashGame.tableCards[1]));
      hands.push(new Card(cashGame.tableCards[2]));
      hands.push(new Card(cashGame.tableCards[3]));
      hands.push(new Card(cashGame.tableCards[4]));
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
      if (players[i] != null && !players[i].stand && players[i].ready) {
        if (maxWinBet < players[i].totalBet) {
          players[i].balance += players[i].totalBet - maxWinBet;
          cashGame.pot -= players[i].totalBet - maxWinBet;
        }
      }
    }
    for (let i = 0; i < top.index.length; i++) {
      winner += players[top.index[i]].user.username + ', ';
      result =
        'won ' +
        Math.floor(
          ((100 - cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake) *
            (cashGame.pot * players[top.index[i]].totalBet)) /
            (totalWinBet *100)
        ) +
        ' chips with ' +
        ranks[players[top.index[i]].rank];
      players[top.index[i]].balance += Math.floor(
        ((100 - cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake) *
          (cashGame.pot * players[top.index[i]].totalBet)) /
          (totalWinBet *100)
      );
    }
    winner = winner.substr(0, winner.length - 2);
    cashGame.pot = 0;
    for (let i = 0; i < cashGame.players.length; i++) {
      const player = cashGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(cashGame.roomId).emit(
        'cash:result',
        filterTableToShow(cashGame, null, true),
        winner,
        result
      );
    }, 1500);

    setTimeout(() => {
      for (let i = 0; i < cashGame.players.length; i++) {
        const player = cashGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      for (let i = 0; i < cashGame.players.length; i++) {
        player = cashGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(i);
          let win = player.balance - player.originBalance;
          const financial = {};
          financial.type = 'Game';
          financial.amount = win;
          User.findByIdAndUpdate(player.user.id, {
            $push: {
              financials: financial
            }
          });
          cashGame.players[i] = null;
        }
      }
      io.to(cashGame.roomId).emit('cash:playersOut', outPlayers);
      io.emit('cash:lobby', {
        cashGames: filterTableForLobby(cashGames)
      });
    }, 3000);

    setTimeout(() => {
      //remove game if no players
      if (
        cashGame.players.filter((ele) => ele != null && !ele.stand && ele.balance > 0).length < 2
      ) {
        cashGame.tableCards = [];
        cashGame.players = cashGame.players.map((ele) => {
          if (ele != null) {
            ele.cards = null;
          }
          return ele;
        });
        cashGame.playing = false;
        io.to(cashGame.roomId).emit('cash:result', filterTableToShow(cashGame, null, true));
        cashGame.playTimeOut = setTimeout(removeCashGame, constants.timeOut * 1000, cashGame.id);
        return;
      }
      setNextRound(cashGame);
    }, 6500);
  }
  function endGame(cashGame) {
    //when only one or 0 players left
    //init
    console.log('end game');
    for (let i = 0; i < cashGame.players.length; i++) {
      const player = cashGame.players[i];
      if (player != null) {
        player.turn = false;
        cashGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        player.cards = null;
        clearTimeout(player.playTimeOut);
      }
    }
    cashGame.tableCards = [];
    io.to(cashGame.roomId).emit('cash:open', filterTableToShow(cashGame, null, true));
    let players = cashGame.players;
    let winner, maxWinBet;
    if (players.filter((ele) => ele != null && !ele.stand && ele.ready && !ele.fold).length == 1) {
      winner = players.find((ele) => ele != null && !ele.stand && ele.ready && !ele.fold);
      winner.win = true;
      winner.rank = 10;
      maxWinBet = winner.totalBet;
      for (let i = 0; i < players.length; i++) {
        if (players[i] != null && !players[i].stand && players[i].ready) {
          if (maxWinBet < players[i].totalBet) {
            players[i].balance += players[i].totalBet - maxWinBet;
            cashGame.pot -= players[i].totalBet - maxWinBet;
          }
        }
      }
      winner.balance += Math.floor((100 - cashRakes.find((ele) => ele.blinds == cashGame.blinds).rake) *cashGame.pot/100);
    }
    cashGame.pot = 0;

    for (let i = 0; i < cashGame.players.length; i++) {
      const player = cashGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(cashGame.roomId).emit('cash:result', filterTableToShow(cashGame, null, true));
    }, 1000);

    setTimeout(() => {
      for (let i = 0; i < cashGame.players.length; i++) {
        const player = cashGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      for (let i = 0; i < cashGame.players.length; i++) {
        player = cashGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(i);
          let win = player.balance - player.originBalance;
          const financial = {};
          financial.type = 'Game';
          financial.amount = win;
          User.findByIdAndUpdate(player.user.id, {
            $push: {
              financials: financial
            }
          });
          cashGame.players[i] = null;
        }
      }
      io.to(cashGame.roomId).emit('cash:playersOut', outPlayers);
      io.emit('cash:lobby', {
        cashGames: filterTableForLobby(cashGames)
      });
    }, 2000);
    //remove game if no players
    if (cashGame.players.filter((ele) => ele != null && !ele.stand && ele.balance > 0).length < 2) {
      cashGame.playing = false;
      cashGame.playTimeOut = setTimeout(removeCashGame, constants.timeOut * 1000, cashGame.id);
      return;
    }
    setTimeout(setNextRound, 3500, cashGame);
  }

  function nextCard(cashGame) {
    console.log('next card');
    //init
    cashGame.dealerPassed = false;
    cashGame.bigBlindPassed = false;
    const players = cashGame.players;
    cashGame.raise = 0;
    cashGame.bet = 0;
    //gather to pot
    for (let i = 0; i < players.length; i++) {
      if (players[i] != null) {
        cashGame.pot += players[i].bet;
        players[i].totalBet += players[i].bet;
        players[i].bet = 0;
      }
    }
    //open table cards
    if (cashGame.tableCards.length == 0) {
      console.log('3 cards open');
      cashGame.tableCards.push(cashGame.cards[cashGame.cardNo]);
      cashGame.cardNo++;
      cashGame.tableCards.push(cashGame.cards[cashGame.cardNo]);
      cashGame.cardNo++;
      cashGame.tableCards.push(cashGame.cards[cashGame.cardNo]);
      cashGame.cardNo++;
    } else if (cashGame.tableCards.length < 5) {
      console.log('next card open');
      cashGame.tableCards.push(cashGame.cards[cashGame.cardNo]);
      cashGame.cardNo++;
    } else {
      console.log('result');
      calcResult(cashGame);
      return;
    }
    setTimeout(() => {
      io.to(cashGame.roomId).emit('cash:card', {
        tableCards: cashGame.tableCards,
        pot: cashGame.pot
      });
      if (players.filter((ele) => ele != null && ele.ready && !ele.stand && !ele.fold).length < 2) {
        endGame(cashGame);
        return;
      } else if (
        players.filter((ele) => ele != null && ele.ready && !ele.stand && !ele.fold && !ele.allIn)
          .length < 2
      ) {
        nextCard(cashGame);
        return;
      }

      let position = cashGame.dealerNext;
      if (
        players[position].allIn ||
        players[position].fold ||
        players[position].stand ||
        !players[position].ready ||
        players[position].balance == 0
      ) {
        position = getNextPlayer(cashGame, position);
      }

      if (position < 0) {
        nextCard(cashGame);
        return;
      }
      players[position].turn = true;
      players[position].turnTime = 0;
      players[position].playTimeOut = setTimeout(
        turnTimeOut,
        cashGame.turnTime * 10,
        cashGame,
        position
      );
      cashGame.allowedBet = allowedBet(cashGame, position);
      io.to(cashGame.roomId).emit('cash:turn', {
        position,
        time: 0,
        amount: cashGame.allowedBet
      });
    }, 1500);
  }

  function nextTurn(cashGame, position) {
    const players = cashGame.players;
    let newPosition = getNextPlayer(cashGame, position);
    if (newPosition < 0) {
      //next card
      if (players[position] != null) players[position].turn = false;
      nextCard(cashGame);
      return;
    } else {
      //turn out
      if (players[position] != null) players[position].turn = false;

      if (
        players[newPosition].bet >= cashGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2
      ) {
        endGame(cashGame);
        return;
      } else if (
        players[newPosition].bet >= cashGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold && !ele.allIn).length < 2
      ) {
        nextCard(cashGame);
        return;
      }

      players[newPosition].turn = true;
      players[newPosition].turnTime = 0;
      players[newPosition].playTimeOut = setTimeout(
        turnTimeOut,
        cashGame.turnTime * 10,
        cashGame,
        newPosition
      );
      cashGame.allowedBet = allowedBet(cashGame, newPosition);
      io.to(cashGame.roomId).emit('cash:turn', {
        position: newPosition,
        time: 0,
        amount: cashGame.allowedBet
      });
    }
  }

  function standPlayer(cashGame, position) {
    cashGame.players[position].stand = true;
    cashGame.players[position].turn = false;
    cashGame.players[position].ready = false;
    cashGame.players[position].cards = null;
    cashGame.pot += cashGame.players[position].bet;
    cashGame.players[position].bet = 0;
    cashGame.players[position].totalBet = 0;
    io.to(cashGame.roomId).emit('cash:stand', {
      position
    });
  }

  function turnTimeOut(cashGame, position) {
    cashGame.players[position].turnTime += cashGame.turnTime * 10;
    const player = cashGame.players[position];
    if (player.behavior && 1000 <= player.turnTime) {
      bet(cashGame.players, position, cashGame.bet);
      io.to(cashGame.roomId).emit('cash:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: cashGame.pot
      });
      if (
        cashGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand && ele.ready)
          .length < 2
      ) {
        endGame(cashGame);
      } else {
        nextTurn(cashGame, position);
      }
    } else if (cashGame.turnTime * 1000 <= player.turnTime) {
      if (player.bet == cashGame.bet) {
        bet(cashGame.players, position, cashGame.bet);
      } else {
        standPlayer(cashGame, position);
      }

      io.to(cashGame.roomId).emit('cash:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: cashGame.pot
      });
      if (
        cashGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand && ele.ready)
          .length < 2
      ) {
        endGame(cashGame);
      } else {
        nextTurn(cashGame, position);
      }
    } else {
      io.to(cashGame.roomId).emit('cash:turn', {
        position,
        time: player.turnTime
      });
      player.playTimeOut = setTimeout(turnTimeOut, cashGame.turnTime * 10, cashGame, position);
    }
  }

  function bet(players, position, amount) {
    if (players[position].balance <= amount) {
      players[position].bet += players[position].balance;
      players[position].balance = 0;
      players[position].allIn = true;
    } else {
      players[position].bet += Math.floor(amount);
      players[position].balance -= Math.floor(amount);
    }
  }

  function setFirstRound(cashGame) {
    cashGame.nonce = cashGame.nonce ? cashGame.nonce + 1 : 0;
    cashGame.cards = generateCards(
      cashGame.serverSeed,
      cashGame.id + cashGame.name,
      cashGame.nonce,
      0,
      52
    );
    let players = cashGame.players;
    //init
    cashGame.tableCards = [];
    cashGame.dealerPassed = false;
    cashGame.bigBlindPassed = false;
    cashGame.pot = 0;

    cashGame.cardNo = 0;
    cashGame.players = cashGame.players.map((ele) => {
      if (ele != null && !ele.stand) {
        const item = ele;
        item.turn = false;
        item.bet = 0;
        item.fold = false;
        item.allIn = false;
        item.behavior = false;
        item.totalBet = 0;
        item.ready = true;
        item.win = null;
        item.rank = null;
        item.result;
        item.allIn = false;
        item.fold = false;
        item.balance=item.addChip ? item.balance+item.addChip : item.balance;
        return item;
      }
      return ele;
    });
    cashGame.bet = cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    cashGame.raise = cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    console.log('init');
    //share the cards
    sharePlayerCards(cashGame);
    //find dealer
    let position = players.findIndex(
      (player) =>
        player != null &&
        player.stand == false &&
        player.allIn == false &&
        player.fold == false &&
        player.ready == true
    );
    cashGame.dealer = position;
    if (
      players.filter(
        (ele) =>
          ele != null &&
          ele.stand == false &&
          ele.allIn == false &&
          ele.fold == false &&
          ele.ready == true
      ).length == 2
    ) {
      bet(players, position, cashGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlind = position;
      cashGame.dealerNext = position;
      bet(players, position, cashGame.blinds == 2 ? 5 : cashGame.blinds * 2);
      cashGame.bigBlindNext = getNextPlayer(cashGame, position, false);
    } else {
      //small Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.dealerNext = position;
      bet(players, position, cashGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlind = position;
      bet(players, position, cashGame.blinds == 2 ? 5 : cashGame.blinds * 2);
      cashGame.bigBlindNext = getNextPlayer(cashGame, position, false);
    }
    console.log('started');
    io.to(cashGame.roomId).emit('cash:start', {
      cashGame: filterTableToShow(cashGame, null)
    });
    position = getNextPlayer(cashGame, position, false);
    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      cashGame.turnTime * 10,
      cashGame,
      position
    );

    cashGame.allowedBet = allowedBet(cashGame, position);
    io.to(cashGame.roomId).emit('cash:turn', {
      position,
      time: 0,
      amount: cashGame.allowedBet
    });
  }

  function setNextRound(cashGame) {
    cashGame.nonce++;
    cashGame.cards = generateCards(
      cashGame.serverSeed,
      cashGame.id + cashGame.name,
      cashGame.nonce,
      0,
      52
    );
    let players = cashGame.players;
    //init
    players = players.map((ele) => {
      if (ele != null && ele.balance != 0 && !ele.stand) {
        ele.ready = true;
        ele.totalBet = 0;
        ele.bet = 0;
        ele.cards = null;
        ele.behavior = false;
        ele.win = null;
        ele.rank = null;
        ele.balance=ele.addChip ? ele.balance+ele.addChip : ele.balance;
        ele.result;
      }
      return ele;
    });
    cashGame.pot = 0;
    cashGame.bet = cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    cashGame.raise = cashGame.blinds == 2 ? 5 : cashGame.blinds * 2;
    cashGame.bigBlindPassed = false;
    cashGame.dealerPassed = false;
    cashGame.cardNo = 0;
    cashGame.tableCards = [];
    //share the cards
    sharePlayerCards(cashGame);
    let position = getNextPlayer(cashGame, cashGame.dealer, false);
    cashGame.dealer = position;
    if (
      players.filter(
        (ele) =>
          ele != null &&
          ele.stand == false &&
          ele.allIn == false &&
          ele.fold == false &&
          ele.ready == true
      ).length == 2
    ) {
      bet(players, position, cashGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlind = position;
      cashGame.dealerNext = position;
      bet(players, position, cashGame.blinds == 2 ? 5 : cashGame.blinds * 2);
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlindNext = position;
    } else {
      //small Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.dealerNext = position;

      bet(players, position, cashGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlind = position;

      bet(players, position, cashGame.blinds == 2 ? 5 : cashGame.blinds * 2);
      position = getNextPlayer(cashGame, position, false);
      cashGame.bigBlindNext = position;
    }
    io.to(cashGame.roomId).emit('cash:start', {
      cashGame: filterTableToShow(cashGame, null)
    });

    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      cashGame.turnTime * 10,
      cashGame,
      position
    );
    cashGame.allowedBet = allowedBet(cashGame, position);
    io.to(cashGame.roomId).emit('cash:turn', {
      position,
      time: 0,
      amount: cashGame.allowedBet
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
    } else if (socket.user.pivx < 100 || socket.user.pivx < data.buyIn[0]) {
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
    if (cashGames.find((ele) => ele.name == data.name)) {
      callback({
        message: 'Table Name is already taken!',
        status: false
      });
      return;
    }
    const cashGame = data;
    const cashGameDB = new CashGame();
    cashGameDB.name = data.name;
    cashGameDB.blinds = data.blinds;
    cashGameDB.minChips = data.buyIn[0];
    cashGameDB.maxChips = data.buyIn[1];
    cashGameDB.seats = data.tableSize;
    cashGameDB.serverSeed = generateServerSeed();
    await cashGameDB.save();
    cashGame.id = cashGameDB.id;

    cashGame.roomId = 'cash_' + cashGame.id;
    cashGame.creator = { id: socket.id, username: socket.user.username };
    cashGame.playing = false;
    cashGame.tableCards = [];
    cashGame.pot = 0;
    cashGame.bet = 0;
    cashGame.raise = 0;
    cashGame.playTimeOut = null;
    cashGame.players = [];
    cashGame.serverSeed = cashGameDB.serverSeed;
    cashGame.serverHash = sha256(cashGame.serverSeed);
    cashGame.cardNo = 0;
    cashGame.dealerPassed = false;
    cashGame.bigBlindPassed = false;
    cashGame.dealer = 0;
    for (let i = 0; i < cashGame.tableSize; i++) {
      cashGame.players.push(null);
    }

    cashGame.playTimeOut = setTimeout(removeCashGame, constants.timeOut * 1000, cashGame.id);

    cashGames.push(cashGame);
    io.emit('cash:lobby', {
      cashGames: filterTableForLobby(cashGames)
    });
    callback({
      id: cashGame.id,
      pivx: socket.user.pivx,
      status: true
    });
  };

  const enterGame = async (id, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == id);
    if (cashGame) {
      if (!socket.rooms.has('cash_' + id)) socket.join('cash_' + id);
      const data = filterTableToShow(cashGame, socket);
      callback({
        cashGame: data
      });
    }
  };

  const showMyCards = async (id, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == id);
    if (cashGame) {
      callback({
        cards: cashGame.players.find((ele) => ele != null && ele.user.id == socket.user.id).cards
      });
    }
  };

  const joinGame = async (roomId, playerNo, password, buyIn, callback) => {
    console.log('join');
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      callback({
        message: 'There is no table!',
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
    } else if (!cashGame) {
      callback({
        message: 'No game existed!',
        status: false
      });
      return;
    } else if (socket.user.pivx < cashGame.buyIn[0] || buyIn > socket.user.pivx) {
      callback({
        message: 'Not enough balance to join a table!',
        status: false
      });
      return;
    } else if (buyIn > cashGame.buyIn[1]) {
      callback({
        message: 'Too many chips!',
        status: false
      });
      return;
    } else if (buyIn < cashGame.buyIn[0]) {
      callback({
        message: 'Too small chips!',
        status: false
      });
      return;
    } else if (
      cashGame.players.find((ele) => (ele != null ? ele.user.id === socket.user.id : false))
    ) {
      callback({
        message: 'Already joined!',
        status: false
      });
      return;
    } else if (cashGame.players[playerNo] !== null) {
      callback({
        message: 'There is a player in this seat!',
        status: false
      });
      return;
    } else if (cashGame.privacy && password != cashGame.password) {
      callback({
        message: 'Wrong Password!',
        status: false
      });
      return;
    }

    socket.join('cash_' + roomId);
    const player = {
      avatar: socket.user.profilePhoto,
      id: socket.id,
      user: socket.user,
      cards: null,
      dealer: false,
      turn: false,
      originBalance: buyIn,
      balance: buyIn,
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
            pivx: -buyIn
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
    } catch (e) {
      console.log(e);
    }
    cashGame.players[playerNo] = player;

    io.emit('cash:lobby', {
      cashGames: filterTableForLobby(cashGames)
    });
    socket.to(cashGame.roomId).emit('cash:join', {
      playerNo: playerNo,
      player: filterPlayerToShow(cashGame.players[playerNo])
    });
    const data = filterTableToShow(cashGame, socket);

    callback({
      cashGame: data,
      status: true,
      pivx: socket.user.pivx
    });

    if (cashGame.players.filter((ele) => ele != null && !ele.stand).length > 1) {
      //game start
      clearTimeout(cashGame.playTimeOut);
      cashGame.playTimeOut = null;
      if (!cashGame.playing) {
        cashGame.playing = true;

        //game start
        setFirstRound(cashGame);
      }
    }
  };

  const betGame = async (roomId, bet) => {
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      return;
    }
    const position = cashGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    const player = cashGame.players[position];
    clearTimeout(player.playTimeOut);
    player.playTimeOut = null;
    let raise = false,
      betStatus = false,
      call = false;
    if (player.turn && player.ready && !player.stand && !player.fold && !player.allIn) {
      if (bet.status == 'fold') {
        cashGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;

        player.fold = true;
      } else if (bet.status == 'allIn') {
        if (cashGame.allowedBet.status == 'allIn_no') {
          player.balance -= Math.floor(cashGame.allowedBet.maxRaise - player.bet);
          player.bet = cashGame.allowedBet.maxRaise;
          cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
          raise = true;
        } else {
          player.allIn = true;
          player.bet += player.balance;
          player.balance = 0;
          if (!cashGame.limit)
            cashGame.raise =
              cashGame.raise < player.bet - cashGame.bet
                ? player.bet - cashGame.bet
                : cashGame.raise;
          cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
        }
      } else {
        if (bet.amount >= player.bet + player.balance) {
          if (cashGame.allowedBet.status == 'allIn_no') {
            raise = true;
            player.balance -= Math.floor(cashGame.allowedBet.maxRaise - player.bet);
            player.bet = cashGame.allowedBet.maxRaise;
            cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
          } else {
            player.allIn = true;
            player.bet += player.balance;
            player.balance = 0;

            if (!cashGame.limit)
              cashGame.raise =
                cashGame.raise < player.bet - cashGame.bet
                  ? player.bet - cashGame.bet
                  : cashGame.raise;
            cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
          }
        } else if (bet.amount < cashGame.bet) {
          cashGame.pot += player.bet;
          player.totalBet = player.bet;
          player.bet = 0;
          player.fold = true;
        } else if (bet.amount == cashGame.bet) {
          if (cashGame.bet > player.bet) call = true;
          player.balance -= Math.floor(cashGame.bet - player.bet);
          player.bet = cashGame.bet;
        } else {
          if (bet.amount < cashGame.allowedBet.minRaise) {
            if (cashGame.bet > player.bet) call = true;
            player.balance -= Math.floor(cashGame.bet - player.bet);
            player.bet = cashGame.bet;
          } else if (bet.amount > cashGame.allowedBet.maxRaise) {
            raise = true;
            bet.amount = cashGame.allowedBet.maxRaise;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!cashGame.limit)
              cashGame.raise =
                cashGame.raise < player.bet - cashGame.bet
                  ? player.bet - cashGame.bet
                  : cashGame.raise;
            cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
          } else {
            if (cashGame.bet == 0 && player.bet == 0) {
              betStatus = true;
            } else raise = true;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!cashGame.limit)
              cashGame.raise =
                cashGame.raise < player.bet - cashGame.bet
                  ? player.bet - cashGame.bet
                  : cashGame.raise;
            cashGame.bet = cashGame.bet < player.bet ? player.bet : cashGame.bet;
          }
        }
      }
      io.to(cashGame.roomId).emit('cash:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: cashGame.pot,
        raise,
        call,
        betStatus
      });
      if (
        cashGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand && ele.ready)
          .length < 2
      ) {
        console.log('after bet, end Game');
        endGame(cashGame);
      } else {
        console.log('after bet, next turn');
        nextTurn(cashGame, position);
      }
    }
  };

  const behaviorGame = async (roomId, behavior, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      return;
    }
    const player = cashGame.players.find((ele) => ele != null && ele.user.id == socket.user.id);
    player.behavior = behavior;
    callback(behavior);
  };

  const standGame = async (roomId, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      return;
    }
    const position = cashGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position > -1) {
      const player = cashGame.players[position];
      player.stand = !player.stand;
      if (player.stand) {
        const turn = player.turn;
        player.turn = false;
        player.ready = false;
        player.cards = null;
        cashGame.pot += player.bet;
        player.bet = 0;
        player.totalBet = 0;
        socket.to(cashGame.roomId).emit('cash:stand', {
          position
        });
        callback(player.stand);

        if (turn) {
          clearTimeout(player.playTimeOut);

          nextTurn(cashGame, position);
        }
      } else {
        socket.to(cashGame.roomId).emit('cash:sit', {
          position
        });
        callback(player.stand);
        if (cashGame.players.filter((ele) => ele != null && !ele.stand).length > 1) {
          //game start
          clearTimeout(cashGame.playTimeOut);
          cashGame.playTimeOut = null;
          if (!cashGame.playing) {
            cashGame.playing = true;

            //game start
            setFirstRound(cashGame);
          }
        }
      }
    }
  };

  const leaveGame = async (roomId, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      return;
    }
    const position = cashGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position < 0) return;
    let player = cashGame.players[position];
    const turn = player.turn;
    clearTimeout(player.playTimeOut);
    cashGame.pot += player.bet;
    let win = player.balance - player.originBalance;
    let bonus = win > 0 ? Math.floor(win / 200) : 0;

    console.log('here');
    console.log('win' + win + ' total=' + (win + player.originBalance));
    let financial = {};
    financial.type = 'Game';
    financial.amount = win;

    try {
      const user = await User.findByIdAndUpdate(
        player.user.id,
        {
          $inc: {
            pivx: win + player.originBalance
          },
          $push: {
            financials: financial
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
      if (user.referrer && bonus > 0) {
        financial = {};
        financial.type = 'Bonus';
        financial.amount = bonus;
        const bonusData = {};
        bonusData.table = cashGame.id;
        bonusData.amount = bonus;
        bonusData.user = user.username;
        bonusData.game = 'CashGame';
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
    cashGame.players[position] = null;
    io.emit('cash:lobby', {
      cashGames: filterTableForLobby(cashGames)
    });
    socket.to(cashGame.roomId).emit('cash:leave', {
      position
    });
    callback(true);

    if (turn) {
      nextTurn(cashGame, position);
    }
  };
  const addChips = async (roomId, chips, callback) => {
    const cashGame = cashGames.find((ele) => ele.id == roomId);
    if (!cashGame) {
      callback({
        message: 'No table existed!',
        status: false
      });
      return;
    }
    const position = cashGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    const player = cashGame.players[position];
    if (socket.user.pivx < chips || chips + player.balance > cashGame.buyIn[1]) {
      callback({
        message: 'Too many chips requested!',
        status: false
      });
      return;
    }
    const user = await User.findByIdAndUpdate(
      socket.user.id,
      {
        $inc: {
          pivx: -chips
        }
      },
      { new: true }
    );
    socket.user.pivx = user.pivx;
    player.addChip=Math.floor(chips);
    callback({
      balance: player.balance,
      pivx: user.pivx,
      status: true
    });
  };
  socket.on('cash:create', createGame);
  socket.on('cash:enter', enterGame);
  socket.on('cash:join', joinGame);
  socket.on('cash:bet', betGame);
  socket.on('cash:behavior', behaviorGame);
  socket.on('cash:stand', standGame);
  socket.on('cash:leave', leaveGame);
  socket.on('cash:addChips', addChips);
  socket.on('cash:showMyCards', showMyCards);
};
