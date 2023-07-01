function solver(hand) {
  let flags = { isStraight: false, isFlush: false, isRoyalFlush: false, isStraightFlush: false, isFourOfAKind: false, isFullHouse: false, isThreeOfAKind: false, isTwoPair: false, isPair: false, isHighCard: false }
  let cards = { unsorted: hand, sorted: hand.slice().sort((a,b)=>(a.value - b.value)), countByValue: [], flushCards: null, straightCards: null, straightFlushCards: null, isPossibleFlush: false, possibleFlushSuit: null}
  let handValues = [];
  cards.isPossibleFlush = HasAFlush(hand);
  cards.possibleFlushSuit = cards.isPossibleFlush ? GetFlushSuit(hand) : null;
  cards.flushCards = cards.isPossibleFlush ? cards.sorted.filter(card => card.suit == cards.possibleFlushSuit) : null;
  cards.countByValue = cards.sorted.reduce((acc, card) => {acc[card.value] = (acc[card.value] || 0) + 1; return acc; }, {});
  if (cards.flushCards) {
      flags.isFlush = true; handValues = [cards.flushCards[cards.flushCards.length-1].value,cards.flushCards[cards.flushCards.length-2].value,cards.flushCards[cards.flushCards.length-3].value,cards.flushCards[cards.flushCards.length-4].value,cards.flushCards[cards.flushCards.length-5].value]; //check if the hand is a flush and get the hand value
      cards.straightFlushCards = GetStraightCards(cards.flushCards, cards.flushCards.find(card => card.value == 13)); 
      flags.isStraightFlush = cards.straightFlushCards ? true : false;
      if (flags.isStraightFlush) {
          flags.isStraight = true;
          flags.isStraightFlush = true; 
          flags.isRoyalFlush = cards.straightFlushCards[0].value == 9 ? true : false;
          handValues = [cards.straightFlushCards[cards.straightFlushCards.length-1].value];
      }
  } else {
      cards.straightCards = GetStraightCards(cards.sorted);
      flags.isStraight = cards.straightCards ? true : false;
      if (flags.isStraight) 
      { 
        handValues = [cards.straightCards[cards.straightCards.length-1].value]; 
      }
  }
  //4/3/2 of a kind logic
  if (!flags.isStraightFlush && !flags.isFlush && !flags.isStraight) {
    const fours = Object.keys(cards.countByValue).filter(value => cards.countByValue[value] >= 4).sort((a,b)=>(a-b));
    if (fours.length == 1) {
      handValues = [parseInt(fours[0]), cards.sorted.reduce((acc, card) => {if (card.value !== parseInt(fours[0]) && (acc === null || card.value > acc)) { return card.value; } return acc;}, null)]; 
      flags.isFourOfAKind = true;
    }
    const triples = Object.keys(cards.countByValue).filter(value => { return cards.countByValue[value] >= 3 && (!fours.includes(value) || cards.countByValue[value] >= 4); }).sort((a,b)=>(a-b));
    const pairs = Object.keys(cards.countByValue).filter(value => { return cards.countByValue[value] >= 2 && (!triples.includes(value) && !fours.includes(value) || cards.countByValue[value] >= 4 || (cards.countByValue[value] == 3 && triples.length == 0));}).sort((a,b) => (a-b));
    if (triples.length == 1 && flags.isFourOfAKind == false && pairs.length == 0) {
      let v1 = parseInt(triples[0]);
      let v2 = cards.sorted.reduce((acc, card) => {if (card.value !== v1 && (acc === null || card.value > acc)) { return card.value; } return acc;}, null);
      let v3 = cards.sorted.reduce((acc, card) => {if (card.value !== v1 && card.value !== v2 && (acc === null || card.value > acc)) { return card.value; } return acc;}, null);
      handValues = [v1, v2, v3]; 
      flags.isThreeOfAKind = true;
    } else if (triples.length >= 1 && pairs.length >= 1 && flags.isThreeOfAKind == false && flags.isFourOfAKind == false) {
      handValues = [parseInt(triples[0]), parseInt(pairs[0])]; 
      flags.isFullHouse = true;
    } else if (pairs.length >= 2 && flags.isFourOfAKind == false && flags.isThreeOfAKind == false && flags.isFullHouse == false) {
      const cardsWithoutPairs = cards.sorted.filter(card => card.value != pairs[pairs.length-1] && card.value != pairs[pairs.length-2]); 
      handValues = [parseInt(pairs[pairs.length-1]), parseInt(pairs[pairs.length-2]), cardsWithoutPairs[cardsWithoutPairs.length-1].value]; 
      flags.isTwoPair = true;
    } else if (pairs.length == 1 && flags.isFourOfAKind == false && flags.isThreeOfAKind == false && flags.isFullHouse == false) {
      const cardsWithoutPair = cards.sorted.filter(card => card.value != pairs[0]);
      handValues = [parseInt(pairs[0]), cardsWithoutPair[cardsWithoutPair.length-1].value, cardsWithoutPair[cardsWithoutPair.length-2].value, cardsWithoutPair[cardsWithoutPair.length-3].value]; 
      flags.isPair = true;
    } else if (flags.isFourOfAKind == false && flags.isThreeOfAKind == false && flags.isPair == false && flags.isTwoPair == false && flags.isStraight == false && flags.isFlush == false && flags.isStraightFlush == false && flags.isRoyalFlush == false){
      handValues = [cards.sorted[cards.sorted.length-1].value, cards.sorted[cards.sorted.length-2].value, cards.sorted[cards.sorted.length-3].value, cards.sorted[cards.sorted.length-4].value, cards.sorted[cards.sorted.length-5].value]; 
      flags.isHighCard = true;
    }
  }
  if (flags.isRoyalFlush) { return { rank: 9, desc: "Royal Flush" }; } 
  if (flags.isStraightFlush) { return { rank: 8, desc: 'Straight Flush', value: handValues[0] }; }
  if (flags.isFourOfAKind) { return { rank: 7, desc: 'Four of a Kind', value: handValues[0], value2: handValues[1] }; }
  if (flags.isFullHouse) { return { rank: 6, desc: 'Full House', value: handValues[0], value2: handValues[1] }; }
  if (flags.isFlush) { return { rank: 5, desc: 'Flush', value: handValues, value2: handValues[1], value3: handValues[2], value4: handValues[3], value5: handValues[4]}; }
  if (flags.isStraight) { return { rank: 4, desc: 'Straight', value: handValues[0] }; }
  if (flags.isThreeOfAKind) { return { rank: 3, desc: 'Three of a Kind', value: handValues[0], value2: handValues[1], value3: handValues[2]}; }
  if (flags.isTwoPair) { return { rank: 2, desc: 'Two Pair', value: handValues[0], value2: handValues[1], value3: handValues[2] }; }
  if (flags.isPair) { return { rank: 1, desc: 'One Pair', value: handValues[0], value2: handValues[1], value3: handValues[2], value4: handValues[3] }; }  
  return { rank: 0, desc: 'High Card', value: handValues[0], value2: handValues[1], value3: handValues[2], value4: handValues[3], value5: handValues[4]};
}
function HasAFlush(cards) {
  const suits = cards.map(card => card.suit);
  return ['H', 'D', 'S', 'C'].some(suit => { if (suits.filter(cardSuit => cardSuit === suit).length >= 5) return true; });
}
function GetFlushSuit(cards) {
  const suits = cards.map(card => card.suit);
  return ['H', 'D', 'S', 'C'].find(suit => { 
    if (suits.filter(cardSuit => cardSuit === suit).length >= 5){ 
      return true;
    }
  });
}
function isSequential(numbers) {
  const sortedNumbers = numbers.slice().sort((a, b) => a - b);
  const isConsecutive = sortedNumbers.every((num, index) => {
    if (index === 0) return true;
    return num === sortedNumbers[index - 1] + 1;
  });
  return isConsecutive;
}
function GetStraightCards(sortedCards, aceCard = null) {
  const uniqueValues = [...new Set(sortedCards.map(card => card.value))];
  sortedCards = sortedCards.filter(card => uniqueValues.includes(card.value));
  for (let i=0; i < 3; i++) {
    const cardsToCheck = sortedCards.slice(sortedCards.length - i - 5, sortedCards.length - i); //get the last 5 cards
    if (cardsToCheck.length < 5) { break; } //short circuit if we don't have enough cards to make a straight
    const cardValues = cardsToCheck.map(card => card.value);
    if (isSequential(cardValues)) { 
      return cardsToCheck; } //return a standard straight
    if (aceCard && cardsToCheck[0].value == 1 && cardsToCheck[1].value == 2 && cardsToCheck[2].value == 3 && cardsToCheck[3].value == 4 && aceCard.value == 13) { //detect a bicycle straight
      cardsToCheck.pop(); cardsToCheck.unshift(aceCard); //pop the ace off the end and put it on the front so the value of the straight is a 5 instead of a 13
      return cardsToCheck;
    }
  }
  return null;
}
module.exports = solver;
