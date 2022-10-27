function solver(hand) {

  const funcs = [checkRoyalFlush, checkStraightFlush, checkFourKind,
    checkFullHouse, checkFlush, checkStraight, checkThreeKind,
    checkTwoPair, checkPair, findHighCard]

  for (let i = 0; i < funcs.length; i++) {
    let result = funcs[i](hand);
    if (result)
      return result;

  }

}

function checkRoyalFlush(hand) {

  const suits = hand.map(card => card.suit);
  const cards = hand.map(card => card.value);

  if (cards.includes(13)) {

    const bigSuits = [];

    for (let i = 0; i < cards.length; i++) {

      if (cards[i] === 13)
        bigSuits.push(suits[i]);

    }

    for (let i = 0; i < bigSuits.length; i++) {

      let found = true;

      for (let j = 9; j <= 12; j++) {

        if (cards.indexOf[j] !== -1 && bigSuits[i] === suits[cards.indexOf(j)])
          continue;

        else {

          found = false;
          break;

        }

      }

      if (found) {

        return {

          rank: 9

        };

      }

    }

  }

  return null;

}

function checkStraightFlush(hand) {

  if (checkFlush(hand)) {

    const straight = checkStraight(hand);

    if (straight) {

      return {

        rank: 8,
        value: [straight.value]

      }

    }

  }

  return null;

}

function checkStraight(hand) {

  const cards = hand.map(card => card.value);
  cards.sort((a, b) => a - b).reverse();

  let checking = true;
  let startingIndex = 1;

  while (checking) {

    let count = 1;
    for (let i = startingIndex; i < 7; i++) {


      if (cards[i] === cards[i - 1]) {

        continue;

      }

      if (cards[i] + 1 !== cards[i - 1]) {
        startingIndex++;
        break;

      }

      count++;

    }

    if (count >= 5)
      checking = false;
    else if (startingIndex >= cards.length-3)
      return null;

  }

  return {

    rank: 4,
    value: [cards[startingIndex - 1]]

  };

}

function checkFlush(hand) {

  const suits = hand.map(card => card.suit);

  const counts = {

    'S': 0,
    'D': 0,
    'C': 0,
    'H': 0

  }

  for (let i = 0; i < suits.length; i++) {

    counts[suits[i]]++;

    if (counts[suits[i]] === 5)
      return {

        rank: 5,
        value: [findHighCard(hand, suits[i], 5).value]

      };

  }

  return null;

}

function checkFourKind(hand) {

  const cards = hand.map(card => card.value);

  const cardCounts = {};

  for (let i = 0; i < cards.length; i++) {

    if (cardCounts[cards[i]])
      cardCounts[cards[i]]++;

    else
      cardCounts[cards[i]] = 1;

    if (cardCounts[cards[i]] === 4)
      return {

        rank: 7,
        value: [cards[i], ...findHighCard(hand.filter(ele=>ele.value!=cards[i]), null, 1).value]

      };

  }

  return null;

}

function checkThreeKind(hand) {

  const cards = hand.map(card => card.value);

  const cardCounts = {};
  const threeValues = [];

  for (let i = 0; i < cards.length; i++) {

    if (cardCounts[cards[i]])
      cardCounts[cards[i]]++;

    else
      cardCounts[cards[i]] = 1;

    if (cardCounts[cards[i]] === 3)
      threeValues.push(cards[i]);

  }

  if (threeValues.length) {

    let highest = 0;

    for (let i = 0; i < threeValues.length; i++) {

      if (threeValues[i] > highest)
        highest = threeValues[i];

    }

    return {

      rank: 3,
      value: [highest, ...findHighCard(hand.filter(ele=>ele.value!=highest), null, 2).value]

    };

  }

  return null;

}

function checkFullHouse(hand) {

  const cards = hand.map(card => card.value);

  const cardCounts = {};

  let threes = [], twos = [];

  for (let i = 0; i < cards.length; i++) {

    if (cardCounts[cards[i]])
      cardCounts[cards[i]]++;

    else
      cardCounts[cards[i]] = 1;

    if (cardCounts[cards[i]] === 2 && cards[i] !== threes)
      twos.push(cards[i]);

    if (cardCounts[cards[i]] === 3) {

      threes.push(cards[i]);
      twos=twos.filter(ele=>ele!=cards[i]);
      

    }

  }
  if(threes.length>1){
    threes=threes.sort((a, b)=>b-a);
    return {

      rank: 6,
      value: [threes[0],threes[1]],

    }
  }else if (threes.length>0 && twos.length>0) {
    const two=twos.sort((a, b)=>b-a)[0];
    return {

      rank: 6,
      value: [threes[0],two],

    }

  }

  return null;

}

function checkTwoPair(hand) {

  const cards = hand.map(card => card.value);

  const cardCounts = {};
  let pairs = [];

  for (let i = 0; i < cards.length; i++) {

    if (cardCounts[cards[i]])
      cardCounts[cards[i]]++;

    else
      cardCounts[cards[i]] = 1;

  }

  const counts = Object.entries(cardCounts);


  for (let i = 0; i < counts.length; i++) {

    if (counts[i][1] === 2)
      pairs.push(Number(counts[i][0]));

  }

  if (pairs.length >= 2) {
    pairs.sort((a, b) => b - a);
    const singleCards=hand.filter(ele=>ele.value!=pairs[0] && ele.value!=pairs[1]);
    return {
      rank: 2,
      value: [pairs[0],pairs[1], ...findHighCard(singleCards, null, 1).value],

    }

  }

  return null;

}

function checkPair(hand) {

  const cards = hand.map(card => card.value);

  const cardCounts = {};

  for (let i = 0; i < cards.length; i++) {

    if (cardCounts[cards[i]])
      cardCounts[cards[i]]++;

    else
      cardCounts[cards[i]] = 1;

    if (cardCounts[cards[i]] === 2){
      const singleCards=hand.filter(ele=>ele.value!=cards[i]);
      return {

        rank: 1,
        value: [cards[i], ...findHighCard(singleCards, null, 3).value]

      };
    }
  }

  return null;

}

function findHighCard(hand, suit = null, count=5) {
  if(suit){
    hand=hand.filter(ele=>ele.suit==suit);
  }
  hand=hand.sort((a,b)=>b.value-a.value).slice(0, count).map(ele=>ele.value);
  


  return {

    rank: 0,
    value: hand

  }

}

module.exports = solver;
