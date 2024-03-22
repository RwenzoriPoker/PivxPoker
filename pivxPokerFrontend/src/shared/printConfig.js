function divThs(number) {
  if (number > 1000) {
    return (
      divThs(Math.floor(number / 1000)) +
      "," +
      (number % 1000 > 99
        ? number % 1000
        : number % 1000 > 9
        ? "0" + (number % 1000)
        : "00" + (number % 1000))
    );
  } else {
    return number;
  }
}

export const showKilo = (number) => {
  if (number >= 10000000) {
    return (number / 1000000).toFixed(0) + "M";
  } else if (number >= 10000) {
    return (number / 1000).toFixed(0) + "K";
  } else return number;
};

export const showDot = (number) => {
  return divThs(number);
};

export const showTurnTime = (number) => {
  return number === 8
    ? `Short(${number}s)`
    : number === 12
    ? `Regular(${number}s)`
    : number === 18
    ? `Long(${number}s)`
    : number === 30
    ? `Very Long(${number}s)`
    : number === 900
    ? `Ultra Long(${number / 60}m)`
    : "";
};

export const showTableSize = (number) => {
  return number === 2 ? `Heads Up` : `${number} seats`;
};

export const showMaxTimeBank = (number) => {
  return number === 20
    ? `Short(${number}s)`
    : number === 45
    ? `Regular(${number}s)`
    : number === 60
    ? `Long(${number / 60}m)`
    : number === 300
    ? `Very Long(${number / 60}m)`
    : "";
};

export function showPlayerChips(number, chips){
  const arr=[];
  chips.sort((a, b)=>(b-a));
  for(let i=0;i<chips.length;i++){
    if(number>chips[i]){
      for(let k=0;k<parseInt(number/chips[i]);k++)
        arr.push(chips[i]);
      number=number%chips[i];
    }
  }  
  return arr;
};

export function showPotChips(number, chips){
  const arr=[];
  let subArr=[];

  chips.sort((a, b)=>(b-a));
  for(let i=0;i<chips.length;i++){
    if(number>=chips[i]){
      for(let k=0;k<parseInt(number/chips[i]);k++){
        if(subArr.length<10)
          subArr.push(chips[i]);
        else{
          arr.push(subArr);
          subArr=[];
          subArr.push(chips[i]);
        }
      }
      number=number%chips[i];
    }
  }  
  arr.push(subArr);
  return arr;
};
