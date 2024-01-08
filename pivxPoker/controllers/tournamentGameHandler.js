const crypto = require('crypto');
const User = require('../models/user');
const TournamentConGame = require('../models/tournamentGame');
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

/**
 * Not used currently
 * @param {*} top 
 * @param {*} player 
 * @returns 
 */
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


/**
 * Validation and bet handling
 * @param {*} TournamentGame 
 * @param {*} position 
 * @returns 
 */
function allowedBet(TournamentGame, position) {
  const players = TournamentGame.players;
  let minRaise, maxRaise, call, status;
  if (!TournamentGame.limit) {
    minRaise = TournamentGame.bet + TournamentGame.raise;
    minRaise=minRaise!=0 ? minRaise : (TournamentGame.blinds==2 ? 5 : TournamentGame.blinds*2);
    maxRaise = players[position].balance + players[position].bet;
  } else {
    minRaise = TournamentGame.bet * 2 - players[position].bet;
    minRaise=minRaise!=0 ? minRaise : (TournamentGame.blinds==2 ? 5 : TournamentGame.blinds*2);
    maxRaise =
      TournamentGame.pot +
      players.reduce((total, ele) => total + ele.bet) +
      2 * TournamentGame.bet -
      players[position].bet;
  }
  if (TournamentGame.bet >= players[position].balance + players[position].bet) {
    //allIn only
    call = players[position].balance + players[position].bet;
    status = 'allIn';
    minRaise = null;
    maxRaise = null;
  } else if (minRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_minRaise';
    minRaise = players[position].balance + players[position].bet;
    minRaise=minRaise!=0 ? minRaise : (TournamentGame.blinds==2 ? 5 : TournamentGame.blinds*2);
    call = TournamentGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else if (maxRaise >= players[position].balance + players[position].bet) {
    status = 'allIn_maxRaise';
    minRaise = minRaise;
    minRaise=minRaise!=0 ? minRaise : (TournamentGame.blinds==2 ? 5 : TournamentGame.blinds*2);
    call = TournamentGame.bet;
    maxRaise = players[position].balance + players[position].bet;
  } else {
    status = 'allIn_no';
    minRaise = minRaise;
    minRaise=minRaise!=0 ? minRaise : (TournamentGame.blinds==2 ? 5 : TournamentGame.blinds*2);
    call = TournamentGame.bet;
    maxRaise = maxRaise;
  }
  return {
    minRaise,
    maxRaise,
    call,
    status
  };
}

/**
 * validation for create table
 * @param {*} data 
 * @returns 
 */
function createValidation(data) {
  if (!data.name || data.name == '') return false;
  if (data.name.length<3 || data.name.length>15) return false;
  if (data.blindSchedule < 0 || data.blindSchedule > 4) return false;
  if (data.buyIn < 100) return false;
  if (!constants.turnTimeList.includes(data.turnTime)) return false;
  if (!constants.startingStackList.includes(data.startingStack)) return false;
  if (!constants.sitTableSizeList.includes(data.tableSize)) return false;
  return true;
}

/**
 * filter table data to show to the players
 * @param {*} TournamentGame 
 * @param {*} socket 
 * @param {*} open 
 * @returns 
 */
function filterTableToShow(TournamentGame, socket, open = false) {
  const data = { ...TournamentGame, playTimeOut: null, blindTimeOut: null };
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

/**
 * filter table to show in the lobby
 * @param {*} TournamentGames 
 * @returns 
 */
function filterTableForLobby(TournamentGames) {
  const filteredGames = TournamentGames.map((ele) => {
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

/**
 * dealer==false => players.bet==game.bet->nextRound
 * true=> get newPostion
 * @param {*} TournamentGame 
 * @param {*} position 
 * @param {*} stop 
 * @returns 
 */
function getNextPlayer(TournamentGame, position, stop = true) {
  let players = TournamentGame.players;
  let newPosition = -1;
  for (let i = 1; i < players.length; i++) {
    const nextPlayer = players[(i + position) % players.length];

    if ((i + position) % players.length == TournamentGame.dealerNext && stop) TournamentGame.dealerPassed = true;
    if ((i + position) % players.length == TournamentGame.bigBlindNext && stop)
      TournamentGame.bigBlindPassed = true;
    if (
      nextPlayer == null ||
      nextPlayer.allIn ||
      nextPlayer.fold ||
      (stop && nextPlayer.stand) ||
      nextPlayer.balance == 0
    )
      continue;
    if (
      nextPlayer.bet == TournamentGame.bet &&
      TournamentGame.bigBlindPassed &&
      TournamentGame.tableCards.length < 2 &&
      stop
    ) {
      newPosition = -1;
      break;
    } else if (
      nextPlayer.bet == TournamentGame.bet &&
      TournamentGame.dealerPassed &&
      TournamentGame.tableCards.length > 2 &&
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

/**
 * 
 * @param {*} TournamentGame 
 */
function sharePlayerCards(TournamentGame) {
  if (!TournamentGame.cardNo) TournamentGame.cardNo = 0;
  for (let i = 0; i < TournamentGame.players.length; i++) {
    if (TournamentGame.players[i] == null) continue;
    TournamentGame.players[i].cards = [TournamentGame.cards[TournamentGame.cardNo], TournamentGame.cards[TournamentGame.cardNo + 1]];
    TournamentGame.cardNo += 2;
  }
}

/**
 * 
 * @param {*} io 
 * @param {*} socket 
 * @param {*} TournamentGames 
 */
module.exports = (io, socket, TournamentGames) => {
  /**
   * Removes the game based on the id
   * @param {string} id 
   */
  async function removeTournamentGame(id) {
    console.log('remove game');
    //TimeOut and remove game
    const index = TournamentGames.findIndex((ele) => (ele.id = id));
    const TournamentGame = TournamentGames[index];
    clearTimeout(TournamentGame.playTimeOut);
    clearTimeout(TournamentGame.blindTimeOut);
    for (let i = 0; i < TournamentGame.players.length; i++) {
      const player = TournamentGame.players[i];
      if (player != null) {
        try {
          const user=await User.findByIdAndUpdate(player.user.id, {
            $inc: {
              pivx: TournamentGame.buyIn
            }
          },{new:true});
        } catch (e) {
          console.log(e);
        }
      }
    }
    const TournamentGameDB = await TournamentConGame.findById(TournamentGame.id);
    TournamentGameDB.closed = true;
    await TournamentGameDB.save();
    TournamentGames.splice(index, 1);
    console.log("sending ping")
    console.log(TournamentGames)
    io.emit('tournament:lobby', {
      TournamentGames: filterTableForLobby(TournamentGames)
    });
    io.to(TournamentGame.roomId).emit('tournament:closed');
  }
  /**
   * Calculated the results
   * written words in the table - player won xx chips with xxxxx
   * @param {object} TournamentGame 
   */
  function calcResult(TournamentGame) {
    let winner='', result='';
    //init
    for (let i = 0; i < TournamentGame.players.length; i++) {
      const player = TournamentGame.players[i];
      if (player != null) {
        player.turn = false;
        TournamentGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        clearTimeout(player.playTimeOut);
      }
    }

    io.to(TournamentGame.roomId).emit('tournament:open', filterTableToShow(TournamentGame, null, true));
    //compare the result
    let players = TournamentGame.players;
    const top = { rank: 0, value: 0, value2: 0, value3: 0, value4: 0, value5: 0, index: [] };
    for (let i = 0; i < players.length; i++) {
      if (players[i] == null || players[i].stand || players[i].fold) continue;
      const hands = [];
      hands.push(new Card(TournamentGame.tableCards[0]));
      hands.push(new Card(TournamentGame.tableCards[1]));
      hands.push(new Card(TournamentGame.tableCards[2]));
      hands.push(new Card(TournamentGame.tableCards[3]));
      hands.push(new Card(TournamentGame.tableCards[4]));
      hands.push(new Card(players[i].cards[0]));
      hands.push(new Card(players[i].cards[1]));
      players[i].result = solver(hands);
      if (top.rank < players[i].result.rank) { //players rank is higher than top rank
        top.rank = players[i].result.rank;
        top.value = players[i].result.value;
        top.index = [i];
      } else if (top.rank == players[i].result.rank) {
        //determine winner by rank and kickers
        switch (players[i].result.rank) {
          case 9: //Royal Flush: anyone with will split the pot
            top.index.push(i);
            break;
          case 8: //Straight Flush: highest card wins, Tie: split the pot
            if (top.value < players[i].result.value) {top.index = [i]; top.value = players[i].result.value; }
            else if (top.value == players[i].result.value) { top.index.push(i); }
            break;
          case 7: //Four of a Kind: highest four of a kind wins, TieBreaker: highest kicker wins, Tie: split the pot
            if (top.value < players[i].result.value) {top.index = [i]; top.value = players[i].result.value; }
            else if (top.value == players[i].result.value) { top.index.push(i); }
            break;
          case 6: //Full House: highest three of a kind wins, TieBreaker: highest pair wins, Tie: split the pot
            if (top.value < players[i].result.value) {top.index = [i]; top.value = players[i].result.value; top.value2 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) {top.index = [i]; top.value2 = players[i].result.kicker1; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2) { top.index.push(i); }
            break;
          case 5: //Flush: highest card wins, compare high cards to break tie. Tie: players have same flush different suits split the pot
            if (top.value < players[i].result.value) { top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) { top.value2 = players[i].result2; top.value3 = 0; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 < players[i].result.value3) { top.value3 = players[i].result3; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 < players[i].result.value4) { top.value4 = players[i].result4; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 == players[i].result.value4 && top.value5 < players[i].result.value5) { top.value5 = players[i].result5; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 == players[i].result.value4 && top.value5 == players[i].result.value5) { top.index.push(i); }
            break;
          case 4: //Straight: highest card wins, Tie: split the pot
            if (top.value < players[i].result.value) {top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value) { top.index.push(i); }
            break;
          case 3: //Three of a Kind: highest three of a kind wins, TieBreaker: highest kicker wins, Tie: split the pot
            if (top.value < players[i].result.value) { top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) { top.value2 = players[i].result2; top.value3 = 0; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 < players[i].result.value3) { top.value3 = players[i].result3; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3) { top.value4 = 0; top.value5 = 0; top.index.push(i); }
            break;
          case 2: //Two Pair: highest pair wins, TieBreaker: highest pair wins, TieBreaker: highest kicker wins, Tie: split the pot
            if (top.value < players[i].result.value) { top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) { top.value2 = players[i].result2; top.value3 = 0; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 < players[i].result.value3) { top.value3 = players[i].result3; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3) { top.value4 = 0; top.value5 = 0; top.index.push(i); }
            break;
          case 1: //One Pair: highest pair wins, TieBreaker: highest kickers in sequence wins Tie: split the pot
          if (top.value < players[i].result.value) { top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) { top.value2 = players[i].result2; top.value3 = 0; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 < players[i].result.value3) { top.value3 = players[i].result3; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 < players[i].result.value4) { top.value4 = players[i].result4; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 == players[i].result.value4) { top.index.push(i); top.value5 = 0; }
            break;
          case 0: //High Card: highest card wins, TieBreaker: highest kickers in sequence wins, Tie: split the pot
            if (top.value < players[i].result.value) { top.index = [i]; top.value = players[i].result.value; top.value2 = 0; top.value3 = 0; top.value4 = 0; top.value5 = 0; }
            else if (top.value == players[i].result.value && top.value2 < players[i].result.value2) { top.value2 = players[i].result2; top.value3 = 0; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 < players[i].result.value3) { top.value3 = players[i].result3; top.value4 = 0; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 < players[i].result.value4) { top.value4 = players[i].result4; top.value5 = 0; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 == players[i].result.value4 && top.value5 < players[i].result.value5) { top.value5 = players[i].result5; top.index = [i]; }
            else if (top.value == players[i].result.value && top.value2 == players[i].result.value2 && top.value3 == players[i].result.value3 && top.value4 == players[i].result.value4 && top.value5 == players[i].result.value5) { top.index.push(i); }
            break;
        }
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
          TournamentGame.pot -= players[i].totalBet - maxWinBet;
        }
      }
    }
    for (let i = 0; i < top.index.length; i++) {
      winner+=players[top.index[i]].user.username+", ";
      result="won "+Math.floor(
        (TournamentGame.pot * players[top.index[i]].totalBet) / totalWinBet
      )+" chips with "+ranks[players[top.index[i]].rank];
      players[top.index[i]].balance += Math.floor(
        (TournamentGame.pot * players[top.index[i]].totalBet) / totalWinBet
      );
    }
    winner=winner.substr(0, winner.length-2);
    TournamentGame.pot = 0;
    for (let i = 0; i < TournamentGame.players.length; i++) {
      const player = TournamentGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(TournamentGame.roomId).emit('tournament:result', filterTableToShow(TournamentGame, null, true), winner, result);
    }, 1500);

    setTimeout(async () => {
      for (let i = 0; i < TournamentGame.players.length; i++) {
        const player = TournamentGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      const outPlayerNumbers = [];
      for (let i = 0; i < TournamentGame.players.length; i++) {
        player = TournamentGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(TournamentGame.players[i].user);
          outPlayerNumbers.push(i);
          TournamentGame.players[i] = null;
        }
      }
      if (TournamentGame.players.filter((ele) => ele != null).length == 1) {
        if (TournamentGame.firstPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(TournamentGame.firstPlace);
          financial.details = '1st Place';
          let bonus = Math.floor(TournamentGame.firstPlace /200);       
          try {
            const user=await User.findByIdAndUpdate(TournamentGame.players.find((ele) => ele != null).user.id, {
              $inc: {
                pivx: TournamentGame.firstPlace
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
              bonusData.table = TournamentGame.id;
              bonusData.amount = bonus;
              bonusData.user = user.username;
              bonusData.game = 'TournamentGame';
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
        if (TournamentGame.secondPlace + TournamentGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(
            (TournamentGame.secondPlace + TournamentGame.thirdPlace) / outPlayers.length
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
                bonusData.table = TournamentGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'TournamentGame';
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
          io.to(TournamentGame.roomId).emit('tournament:second', outPlayerNumbers);
        } else io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);

        io.to(TournamentGame.roomId).emit(
          'tournament:first',
          TournamentGame.players.findIndex((ele) => ele != null)
        );
        //finish the sit game
        const TournamentGameDB = await TournamentConGame.findById(TournamentGame.id);
        TournamentGameDB.closed = true;
        await TournamentGameDB.save();
        clearTimeout(TournamentGame.playTimeOut);
        clearTimeout(TournamentGame.blindTimeOut);
        TournamentGames.splice(
          TournamentGames.findIndex((ele) => ele.id == TournamentGame.id),
          1
        );
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        return;
      } else if (TournamentGame.players.filter((ele) => ele != null).length == 2) {
        if (TournamentGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(TournamentGame.secondPlace / outPlayers.length);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '3rd Place';
          TournamentGame.thirdPlace=0;
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
                bonusData.table = TournamentGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'TournamentGame';
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
          io.to(TournamentGame.roomId).emit('tournament:third', outPlayerNumbers);
        } else io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(TournamentGame);
        }, 4500);
      } else {
        io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(TournamentGame);
        }, 4500);
      }
    }, 3000);
  }
  /**
   * when only one or 0 players left
   * @param {object} TournamentGame 
   */
  function endGame(TournamentGame) {
    //init
    console.log('end game');
    for (let i = 0; i < TournamentGame.players.length; i++) {
      const player = TournamentGame.players[i];
      if (player != null) {
        player.turn = false;
        TournamentGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;
        player.behavior = false;
        player.cards = null;
        clearTimeout(player.playTimeOut);
      }
    }
    TournamentGame.tableCards = [];
    io.to(TournamentGame.roomId).emit('tournament:open', filterTableToShow(TournamentGame, null, true));
    let players = TournamentGame.players;
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
            TournamentGame.pot -= players[i].totalBet - maxWinBet;
          }
        }
      }
      winner.balance += Math.floor(TournamentGame.pot);
    }
    TournamentGame.pot = 0;

    for (let i = 0; i < TournamentGame.players.length; i++) {
      const player = TournamentGame.players[i];
      if (player != null) {
        player.turn = false;
      }
    }
    setTimeout(() => {
      io.to(TournamentGame.roomId).emit('tournament:result', filterTableToShow(TournamentGame, null, true));
    }, 1000);

    setTimeout(async () => {
      for (let i = 0; i < TournamentGame.players.length; i++) {
        const player = TournamentGame.players[i];
        if (player != null) {
          player.allIn = false;
          player.fold = false;
        }
      }
      const outPlayers = [];
      const outPlayerNumbers = [];
      for (let i = 0; i < TournamentGame.players.length; i++) {
        player = TournamentGame.players[i];
        if (player != null && player.balance == 0) {
          outPlayers.push(TournamentGame.players[i].user);
          outPlayerNumbers.push(i);
          TournamentGame.players[i] = null;
        }
      }
      if (TournamentGame.players.filter((ele) => ele != null).length == 1) {
        if (TournamentGame.firstPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(TournamentGame.firstPlace);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '1st Place';
          try {
            const user=await User.findByIdAndUpdate(TournamentGame.players.find((ele) => ele != null).user.id, {
              $inc: {
                pivx: TournamentGame.firstPlace
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
              bonusData.table = TournamentGame.id;
              bonusData.amount = bonus;
              bonusData.user = user.username;
              bonusData.game = 'TournamentGame';
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
        if (TournamentGame.secondPlace + TournamentGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'Sit&Go';
          financial.amount = Math.floor(
            (TournamentGame.secondPlace + TournamentGame.thirdPlace) / outPlayers.length
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
                bonusData.table = TournamentGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'TournamentGame';
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
          io.to(TournamentGame.roomId).emit('tournament:second', outPlayerNumbers);
        } else io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);

        io.to(TournamentGame.roomId).emit(
          'tournament:first',
          TournamentGame.players.findIndex((ele) => ele != null)
        );
        //finish the sit game

        const TournamentGameDB = await TournamentConGame.findById(TournamentGame.id);
        TournamentGameDB.closed = true;
        await TournamentGameDB.save();
        clearTimeout(TournamentGame.playTimeOut);
        clearTimeout(TournamentGame.blindTimeOut);
        TournamentGames.splice(
          TournamentGames.findIndex((ele) => ele.id == TournamentGame.id),
          1
        );
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        return;
      } else if (TournamentGame.players.filter((ele) => ele != null).length == 2) {
        if (TournamentGame.thirdPlace > 0) {
          const financial = {};
          financial.type = 'TournamentGame';
          financial.amount = Math.floor(TournamentGame.secondPlace / outPlayers.length);
          let bonus=Math.floor(financial.amount/200);
          financial.details = '3rd Place';
          TournamentGame.thirdPlace=0;
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
                bonusData.table = TournamentGame.id;
                bonusData.amount = bonus;
                bonusData.user = user.username;
                bonusData.game = 'TournamentGame';
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
          io.to(TournamentGame.roomId).emit('tournament:third', outPlayerNumbers);
        } else io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(TournamentGame);
        }, 1500);
      } else {
        io.to(TournamentGame.roomId).emit('tournament:playersOut', outPlayerNumbers);
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        setTimeout(() => {
          //remove game if no players

          setNextRound(TournamentGame);
        }, 1500);
      }
    }, 1000);
  }

  /**
   * The next card
   * @param {object} TournamentGame 
   * @returns 
   */
  function nextCard(TournamentGame) {
    console.log('next card');
    //init
    TournamentGame.dealerPassed = false;
    TournamentGame.bigBlindPassed = false;
    const players = TournamentGame.players;
    TournamentGame.raise = 0;
    TournamentGame.bet = 0;
    //gather to pot
    for (let i = 0; i < players.length; i++) {
      if (players[i] != null) {
        TournamentGame.pot += players[i].bet;
        players[i].totalBet += players[i].bet;
        players[i].bet = 0;
      }
    }
    //open table cards
    if (TournamentGame.tableCards.length == 0) {
      console.log('3 cards open');
      TournamentGame.tableCards.push(TournamentGame.cards[TournamentGame.cardNo]);
      TournamentGame.cardNo++;
      TournamentGame.tableCards.push(TournamentGame.cards[TournamentGame.cardNo]);
      TournamentGame.cardNo++;
      TournamentGame.tableCards.push(TournamentGame.cards[TournamentGame.cardNo]);
      TournamentGame.cardNo++;      
    } else if (TournamentGame.tableCards.length < 5) {
      console.log('next card open');
      TournamentGame.tableCards.push(TournamentGame.cards[TournamentGame.cardNo]);
      TournamentGame.cardNo++;      
    } else {
      console.log('result');
      calcResult(TournamentGame);
      return;
    }
      setTimeout(()=>{

      io.to(TournamentGame.roomId).emit('tournament:card', {
        tableCards: TournamentGame.tableCards,
        pot: TournamentGame.pot
      });
      if (players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2) {
        endGame(TournamentGame);
        return;
      } else if (
        players.filter((ele) => ele != null && !ele.stand && !ele.fold && !ele.allIn).length < 2
      ) {
        nextCard(TournamentGame);
        return;
      }

      let position = TournamentGame.dealerNext;
      if (
        players[position].allIn ||
        players[position].fold ||
        players[position].stand ||
        players[position].balance == 0
      ) {
        position = getNextPlayer(TournamentGame, position);
      }

      if (position < 0) {
        nextCard(TournamentGame);
        return;
      }
      players[position].turn = true;
      players[position].turnTime = 0;
      players[position].playTimeOut = setTimeout(
        turnTimeOut,
        TournamentGame.turnTime * 10,
        TournamentGame,
        position
      );
      TournamentGame.allowedBet = allowedBet(TournamentGame, position);
      io.to(TournamentGame.roomId).emit('tournament:turn', {
        position,
        time: 0,
        amount: TournamentGame.allowedBet
      });
    },1500);
  }

  /**
   * 
   * @param {object} TournamentGame 
   * @param {*} position 
   * @returns 
   */
  function nextTurn(TournamentGame, position) {
    const players = TournamentGame.players;
    let newPosition = getNextPlayer(TournamentGame, position);
    if (newPosition < 0) {
      //next card
      if (players[position] != null) players[position].turn = false;
      nextCard(TournamentGame);
      return;
    } else {
      //turn out
      if (players[position] != null) players[position].turn = false;
      if (
        players[newPosition].bet >= TournamentGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2
      ) {
        endGame(TournamentGame);
        return;
      } else if (
        players[newPosition].bet >= TournamentGame.bet &&
        players.filter((ele) => ele != null && !ele.stand && !ele.fold && !ele.allIn).length < 2
      ) {
        nextCard(TournamentGame);
        return;
      }
      players[newPosition].turn = true;
      players[newPosition].turnTime = 0;
      players[newPosition].playTimeOut = setTimeout(
        turnTimeOut,
        TournamentGame.turnTime * 10,
        TournamentGame,
        newPosition
      );
      TournamentGame.allowedBet = allowedBet(TournamentGame, newPosition);
      io.to(TournamentGame.roomId).emit('tournament:turn', {
        position: newPosition,
        time: 0,
        amount: TournamentGame.allowedBet
      });
    }
  }

  /**
   * When a player stands
   * @param {object} TournamentGame 
   * @param {*} position 
   */
  function standPlayer(TournamentGame, position) {
    TournamentGame.players[position].stand = true;
    TournamentGame.players[position].turn = false;
    TournamentGame.players[position].cards = null;
    TournamentGame.pot += TournamentGame.players[position].bet;
    TournamentGame.players[position].bet = 0;
    TournamentGame.players[position].totalBet = 0;
    io.to(TournamentGame.roomId).emit('tournament:stand', {
      position
    });
  }
  /**
   * prepare the tournament
   * @param {*} TournamentGame 
   */
  function prepareTournamentGame(TournamentGame) {
    TournamentGame.ready--;
    io.to(TournamentGame.roomId).emit('tournament:ready', {
      time: TournamentGame.ready
    });
    if (TournamentGame.ready <= 0) {
      setFirstRound(TournamentGame);
    } else {
      setTimeout(prepareTournamentGame, 1000, TournamentGame);
    }
  }

  /**
   * Setting the following Blind
   * @param {*} TournamentGame 
   */
  function setNextBlind(TournamentGame) {
    TournamentGame.blindStep++;
    TournamentGame.blinds = constants.sitBlindList[TournamentGame.blindSchedule][TournamentGame.blindStep].blinds;
    TournamentGame.blindTimeOut = setTimeout(
      setNextBlind,
      constants.sitBlindList[TournamentGame.blindSchedule][TournamentGame.blindStep].duration * 60 * 1000,
      TournamentGame
    );
  }

  /**
   * Timeout on each of the turns
   * @param {object} TournamentGame 
   * @param {*} position 
   */
  function turnTimeOut(TournamentGame, position) {
    TournamentGame.players[position].turnTime += TournamentGame.turnTime * 10;
    const player = TournamentGame.players[position];
    if (player.behavior && 1000 <= player.turnTime) {
      bet(TournamentGame.players, position, TournamentGame.bet);
      io.to(TournamentGame.roomId).emit('tournament:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: TournamentGame.pot
      });
      if (
        TournamentGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand)
          .length < 2
      ) {
        endGame(TournamentGame);
      } else {
        nextTurn(TournamentGame, position);
      }
    }else if (TournamentGame.turnTime * 1000 <= player.turnTime) {
      if (player.bet==TournamentGame.bet) {
        bet(TournamentGame.players, position, TournamentGame.bet);
      } else {
        standPlayer(TournamentGame, position);
      }

      io.to(TournamentGame.roomId).emit('tournament:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: TournamentGame.pot
      });
      if (TournamentGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand).length < 2) {
        endGame(TournamentGame);
      } else {
        nextTurn(TournamentGame, position);
      }
    } else {
      io.to(TournamentGame.roomId).emit('tournament:turn', {
        position,
        time: player.turnTime
      });
      player.playTimeOut = setTimeout(
        turnTimeOut,
        TournamentGame.turnTime * 10,
        TournamentGame,
        position
      );
    }
  }

  /**
   * Place a bet
   * @param {*} players 
   * @param {*} position 
   * @param {*} amount 
   * @returns 
   */
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

  /**
   * First round
   * @param {object} TournamentGame 
   */
  function setFirstRound(TournamentGame) {
    TournamentGame.nonce =TournamentGame.nonce ?TournamentGame.nonce+1 : 0;
    TournamentGame.cards = generateCards(
      TournamentGame.serverSeed,
      TournamentGame.id + TournamentGame.name,
      TournamentGame.nonce,
      0,
      52
    );
    let players = TournamentGame.players;
    //init
    TournamentGame.tableCards = [];
    TournamentGame.dealerPassed = false;
    TournamentGame.bigBlindPassed = false;
    TournamentGame.pot = 0;
    
    TournamentGame.cardNo = 0;
    TournamentGame.players = TournamentGame.players.map((ele) => {
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
    TournamentGame.blindStep = 0;
    TournamentGame.blinds = constants.sitBlindList[TournamentGame.blindSchedule][TournamentGame.blindStep].blinds;
    TournamentGame.blindTimeOut = setTimeout(
      setNextBlind,
      constants.sitBlindList[TournamentGame.blindSchedule][TournamentGame.blindStep].duration * 60 * 1000,
      TournamentGame
    );
    TournamentGame.bet = TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2;
    TournamentGame.raise = TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2;
    console.log('init');
    //share the cards
    sharePlayerCards(TournamentGame);
    //find dealer
    let position = 0;
    TournamentGame.dealer = position;
    if (players.filter((ele) => ele != null).length == 2) {
      bet(players, position, TournamentGame.blinds);

      //Big Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.dealerNext = position;
      TournamentGame.bigBlind = position;
      bet(players, position, TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2);
      TournamentGame.bigBlindNext = getNextPlayer(TournamentGame, position, false);
    } else {
      //small Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.dealerNext = position;
      bet(players, position, TournamentGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.bigBlind = position;
      bet(players, position, TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2);
      TournamentGame.bigBlindNext = getNextPlayer(TournamentGame, position, false);
    }
    console.log('started');
    io.to(TournamentGame.roomId).emit('tournament:start', {
      TournamentGame: filterTableToShow(TournamentGame, null)
    });
    position = getNextPlayer(TournamentGame, position, false);
    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      TournamentGame.turnTime * 10,
      TournamentGame,
      position
    );

    TournamentGame.allowedBet = allowedBet(TournamentGame, position);
    io.to(TournamentGame.roomId).emit('tournament:turn', {
      position,
      time: 0,
      amount: TournamentGame.allowedBet
    });
  }

  /**
   * The following round
   * @param {object} TournamentGame 
   * @returns 
   */
  function setNextRound(TournamentGame) {
    TournamentGame.nonce++;
    TournamentGame.cards = generateCards(
      TournamentGame.serverSeed,
      TournamentGame.id + TournamentGame.name,
      TournamentGame.nonce,
      0,
      52
    );
    let players = TournamentGame.players;
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
    TournamentGame.pot = 0;
    TournamentGame.bet = TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2;
    TournamentGame.raise = TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2;
    TournamentGame.bigBlindPassed = false;
    TournamentGame.dealerPassed = false;
    TournamentGame.cardNo = 0;
    TournamentGame.tableCards = [];
    //share the cards
    sharePlayerCards(TournamentGame);
    let position = getNextPlayer(TournamentGame, TournamentGame.dealer, false);
    TournamentGame.dealer = position;
    if (
      players.filter((ele) => ele != null && ele.allIn == false && ele.fold == false).length == 2
    ) {
      bet(players, position, TournamentGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.dealerNext = position;
      TournamentGame.bigBlind = position;
      bet(players, position, TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2);
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.bigBlindNext = position;
    } else {
      //small Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.dealerNext = position;

      bet(players, position, TournamentGame.blinds);
      //Big Blind Bet
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.bigBlind = position;

      bet(players, position, TournamentGame.blinds == 2 ? 5 : TournamentGame.blinds * 2);
      position = getNextPlayer(TournamentGame, position, false);
      TournamentGame.bigBlindNext = position;
    }
    io.to(TournamentGame.roomId).emit('tournament:start', {
      TournamentGame: filterTableToShow(TournamentGame, null)
    });

    if (players[position] == null || players[position].stand) {
      nextTurn(TournamentGame, position);
      return;
    }
    players[position].turn = true;
    players[position].turnTime = 0;
    players[position].playTimeOut = setTimeout(
      turnTimeOut,
      TournamentGame.turnTime * 10,
      TournamentGame,
      position
    );
    TournamentGame.allowedBet = allowedBet(TournamentGame, position);
    io.to(TournamentGame.roomId).emit('tournament:turn', {
      position,
      time: 0,
      amount: TournamentGame.allowedBet
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //socket event functions
  //
  //We won't be using the createGame system as the backend will create the game (for freerolls)
  //
  //
  /**
   * Creates the game
   * @param {*} data 
   * @param {*} callback 
   * @returns 
   */
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
    if (TournamentGames.find((ele) => ele.name == data.name)) {
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
    const TournamentGame= data;
    const TournamentGameDB = new TournamentConGame();
    TournamentGameDB.name = data.name;
    TournamentGameDB.blindsSchedule = data.blindSchedule;
    TournamentGameDB.stack = data.startingStack;
    TournamentGameDB.first = data.firstPlace;
    TournamentGameDB.second = data.secondPlace;
    TournamentGameDB.third = data.thirdPlace;
    TournamentGameDB.seats = data.tableSize;
    TournamentGameDB.buyIn=data.buyIn;
    TournamentGameDB.serverSeed = generateServerSeed();
    await TournamentGameDB.save();
    TournamentGame.id = TournamentGameDB.id;
    console.log(TournamentGame.id)

    TournamentGame.roomId = 'tournament_' + TournamentGame.id;
    TournamentGame.creator = { id: socket.id, username: socket.user.username };
    TournamentGame.playing = false;
    TournamentGame.tableCards = [];
    TournamentGame.pot = 0;
    TournamentGame.bet = 0;
    TournamentGame.raise = 0;
    TournamentGame.playTimeOut = null;
    TournamentGame.players = [];
    TournamentGame.serverSeed = TournamentGameDB.serverSeed;
    TournamentGame.serverHash = sha256(TournamentGame.serverSeed);
    TournamentGame.cardNo = 0;
    TournamentGame.dealerPassed = false;
    TournamentGame.bigBlindPassed = false;
    TournamentGame.dealer = 0;
    const player = {
      avatar: socket.user.profilePhoto,
      id: socket.id,
      user: socket.user,
      cards: null,
      dealer: true,
      turn: false,
      balance: TournamentGame.startingStack,
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
            pivx: -TournamentGame.buyIn
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
    } catch (e) {
      console.log(e);
    }

    TournamentGame.players.push(player);

    TournamentGame.playTimeOut = setTimeout(removeTournamentGame, 
      1200*1000, TournamentGame.id);
    TournamentGames.push(TournamentGame);
    io.emit('tournament:lobby', {
      TournamentGames: filterTableForLobby(TournamentGames)
    });
    callback({
      id: TournamentGame.id,
      pivx: socket.user.pivx,
      status: true
    });
  };

  /**
   * Occures when a player enters the game
   * @param {*} id 
   * @param {*} callback 
   */
  const enterGame = async (id, callback) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == id);
    if (TournamentGame) {
      if (!socket.rooms.has('tournament_' + id)) socket.join('tournament_' + id);
      const data = filterTableToShow(TournamentGame, socket);
      callback({
        TournamentGame: data
      });
    }
  };

  /**
   * Showing a users cards
   * @param {*} id 
   * @param {*} callback 
   */
  const showMyCards = async (id, callback) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == id);
    if (TournamentGame) {
      callback({
        cards: TournamentGame.players.find((ele) => ele != null && ele.user.id == socket.user.id).cards
      });
    }
  };

  /**
   * When a user joins a table
   * @param {*} roomId 
   * @param {*} password 
   * @param {*} callback 
   * @returns 
   */
  const joinGame = async (roomId, password, callback) => {
    console.log('join');
    const TournamentGame = TournamentGames.find((ele) => ele.id == roomId);
    if (!TournamentGame) {
      callback({
        message: 'There is no table!',
        status: false
      });
      return;
    }
    if (TournamentGame.playing) {
      callback({
        message: 'Already started!',
        status: false
      });
      return;
    }
    if (TournamentGame.players.length == TournamentGame.tableSize) {
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
    } else if (socket.user.pivx < TournamentGame.buyIn) {
      callback({
        message: 'Not enough balance to join a table!',
        status: false
      });
      return;
    } else if (TournamentGame.privacy && password != TournamentGame.password) {
      callback({
        message: 'Wrong Password!',
        status: false
      });
      return;
    }
    let joined = TournamentGame.players.findIndex((ele) =>
      ele != null ? ele.user.id === socket.user.id : false
    );
    if (joined > -1) {
      try {
        const user = await User.findByIdAndUpdate(
          socket.user.id,
          {
            $inc: {
              pivx: TournamentGame.buyIn
            }
          },
          { new: true }
        );
        socket.user.pivx = user.pivx;
      } catch (e) {
        console.log(e);
      }
      TournamentGame.players.splice(joined, 1);
      io.emit('tournament:lobby', {
        TournamentGames: filterTableForLobby(TournamentGames)
      });
      socket.to(TournamentGame.roomId).emit('tournament:join', {
        TournamentGame: filterTableToShow(TournamentGame, null)
      });
      const data = filterTableToShow(TournamentGame, socket);
      callback({
        TournamentGame: data,
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
      balance: TournamentGame.startingStack,
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
            pivx: -TournamentGame.buyIn
          }
        },
        { new: true }
      );
      socket.user.pivx = user.pivx;
    } catch (e) {
      console.log(e);
    }
    TournamentGame.players.push(player);

    io.emit('tournament:lobby', {
      TournamentGames: filterTableForLobby(TournamentGames)
    });
    socket.to(TournamentGame.roomId).emit('tournament:join', {
      TournamentGame: filterTableToShow(TournamentGame, null)
    });
    const data = filterTableToShow(TournamentGame, socket);

    callback({
      TournamentGame: data,
      status: true, 
      pivx:socket.user.pivx
    });

    if (TournamentGame.players.length == TournamentGame.tableSize) {
      //game start
      if (!TournamentGame.playing) {
        TournamentGame.playing = true;
        console.log(TournamentGames);
        io.emit('tournament:lobby', {
          TournamentGames: filterTableForLobby(TournamentGames)
        });
        //game start
        TournamentGame.ready = 2;
        clearTimeout(TournamentGame.playTimeOut);
        setTimeout(prepareTournamentGame, 1000, TournamentGame);
      }
    }
  };

  /**
   * Betting on a game
   * @param {*} roomId 
   * @param {*} bet 
   * @returns 
   */
  const betGame = async (roomId, bet) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == roomId);
    if (!TournamentGame) {
      return;
    }
    const position = TournamentGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    const player = TournamentGame.players[position];
    clearTimeout(player.playTimeOut);
    player.playTimeOut = null;
    let raise = false,betStatus=false,
      call = false;
    if (player.turn && !player.stand && !player.fold && !player.allIn) {
      if (bet.status == 'fold') {
        TournamentGame.pot += player.bet;
        player.totalBet += player.bet;
        player.bet = 0;

        player.fold = true;
      } else if (bet.status == 'allIn') {
        if (TournamentGame.allowedBet.status == 'allIn_no') {
          player.balance -= Math.floor(TournamentGame.allowedBet.maxRaise - player.bet);
          player.bet = TournamentGame.allowedBet.maxRaise;
          TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
          raise = true;
        } else {
          player.allIn = true;
          player.bet += player.balance;
          player.balance = 0;
          if (!TournamentGame.limit)
            TournamentGame.raise =
              TournamentGame.raise < player.bet - TournamentGame.bet ? player.bet - TournamentGame.bet : TournamentGame.raise;
          TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
        }
      } else {
        if (bet.amount >= player.bet + player.balance) {
          if (TournamentGame.allowedBet.status == 'allIn_no') {
            raise = true;
            player.balance -= Math.floor(TournamentGame.allowedBet.maxRaise - player.bet);
            player.bet = TournamentGame.allowedBet.maxRaise;
            TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
          } else {
            player.allIn = true;
            player.bet += player.balance;
            player.balance = 0;

            if (!TournamentGame.limit)
              TournamentGame.raise =
                TournamentGame.raise < player.bet - TournamentGame.bet ? player.bet - TournamentGame.bet : TournamentGame.raise;
            TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
          }
        } else if (bet.amount < TournamentGame.bet) {
          TournamentGame.pot += player.bet;
          player.totalBet = player.bet;
          player.bet = 0;
          player.fold = true;
        } else if (bet.amount == TournamentGame.bet) {
          if (TournamentGame.bet > player.bet) call = true;
          player.balance -= Math.floor(TournamentGame.bet - player.bet);
          player.bet = TournamentGame.bet;
        } else {
          if (bet.amount < TournamentGame.allowedBet.minRaise) {
            if (TournamentGame.bet > player.bet) call = true;
            player.balance -= Math.floor(TournamentGame.bet - player.bet);
            player.bet = TournamentGame.bet;
          } else if (bet.amount > TournamentGame.allowedBet.maxRaise) {
            raise = true;
            bet.amount = TournamentGame.allowedBet.maxRaise;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!TournamentGame.limit)
              TournamentGame.raise =
                TournamentGame.raise < player.bet - TournamentGame.bet ? player.bet - TournamentGame.bet : TournamentGame.raise;
            TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
          } else {
            if(TournamentGame.bet==0 && player.bet==0){
              betStatus=true;
            }else
              raise = true;
            player.balance -= Math.floor(bet.amount - player.bet);
            player.bet = bet.amount;
            if (!TournamentGame.limit)
              TournamentGame.raise =
                TournamentGame.raise < player.bet - TournamentGame.bet ? player.bet - TournamentGame.bet : TournamentGame.raise;
            TournamentGame.bet = TournamentGame.bet < player.bet ? player.bet : TournamentGame.bet;
          }
        }
      }
      io.to(TournamentGame.roomId).emit('tournament:bet', {
        position,
        bet: player.bet,
        balance: player.balance,
        fold: player.fold,
        allIn: player.allIn,
        stand: player.stand,
        pot: TournamentGame.pot,
        raise,
        call,
        betStatus
      });
      if (TournamentGame.players.filter((ele) => ele != null && !ele.fold && !ele.stand).length < 2) {
        console.log('after bet, end Game');
        endGame(TournamentGame);
      } else {
        console.log('after bet, next turn');
        nextTurn(TournamentGame, position);
      }
    }
  };

  /**
   * 
   * @param {*} roomId 
   * @param {*} behavior 
   * @param {*} callback 
   * @returns 
   */
  const behaviorGame = async (roomId, behavior, callback) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == roomId);
    if (!TournamentGame) {
      return;
    }
    const player = TournamentGame.players.find((ele) => ele != null && ele.user.id == socket.user.id);
    player.behavior = behavior;
    callback(behavior);
  };

  /**
   * When a user stands
   * @param {*} roomId 
   * @param {*} callback 
   * @returns 
   */
  const standGame = async (roomId, callback) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == roomId);
    if (!TournamentGame) {
      return;
    }
    const position = TournamentGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position > -1) {
      const player = TournamentGame.players[position];
      player.stand = !player.stand;
      if (player.stand) {
        const turn = player.turn;
        player.turn = false;
        player.cards = null;
        TournamentGame.pot += player.bet;
        player.bet = 0;
        player.totalBet = 0;
        socket.to(TournamentGame.roomId).emit('tournament:stand', {
          position
        });
        callback(true);
        // if (TournamentGame.players.filter((ele) => ele != null && !ele.stand && !ele.fold).length < 2) {
        //   endGame(TournamentGame);
        //   return;
        // }
        if (turn) {
          clearTimeout(player.playTimeOut);
          nextTurn(TournamentGame, position);
        }
      } else {
        socket.to(TournamentGame.roomId).emit('tournament:sit', {
          position
        });
        callback(player.stand);
      }
    }
  };

  /**
   * When a user leaves the game
   * @param {*} roomId 
   * @param {*} callback 
   * @returns 
   */
  const leaveGame = async (roomId, callback) => {
    const TournamentGame = TournamentGames.find((ele) => ele.id == roomId);
    if (!TournamentGame) {
      return;
    }
    const position = TournamentGame.players.findIndex(
      (ele) => ele != null && ele.user.id == socket.user.id
    );
    if (position > -1) {
      let player = TournamentGame.players[position];
      const turn = player.turn;

      TournamentGame.pot += player.bet;

      TournamentGame.players[position] = null;
      socket.to(TournamentGame.roomId).emit('tournament:leave', {
        position
      });
      io.emit('tournament:lobby', {
        TournamentGames: filterTableForLobby(TournamentGames)
      });
      callback(true);
      if (turn) {
        clearTimeout(player.playTimeOut);
        nextTurn(TournamentGame, position);
      }
    }
  };

  socket.on('tournament:create', createGame);
  socket.on('tournament:enter', enterGame);
  socket.on('tournament:join', joinGame);
  socket.on('tournament:bet', betGame);
  socket.on('tournament:behavior', behaviorGame);
  socket.on('tournament:stand', standGame);
  socket.on('tournament:leave', leaveGame);

  socket.on('tournament:showMyCards', showMyCards);
};