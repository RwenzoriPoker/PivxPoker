import clubs_green_2 from "../images/cards/2-clubs.png";
import clubs_green_3 from "../images/cards/3-clubs.png";
import clubs_green_4 from "../images/cards/4-clubs.png";
import clubs_green_5 from "../images/cards/5-clubs.png";
import clubs_green_6 from "../images/cards/6-clubs.png";
import clubs_green_7 from "../images/cards/7-clubs.png";
import clubs_green_8 from "../images/cards/8-clubs.png";
import clubs_green_9 from "../images/cards/9-clubs.png";
import clubs_green_10 from "../images/cards/10-clubs.png";
import clubs_green_A from "../images/cards/A-clubs.png";
import clubs_green_J from "../images/cards/J-clubs.png";
import clubs_green_K from "../images/cards/K-clubs.png";
import clubs_green_Q from "../images/cards/Q-clubs.png";


import clubs_black_2 from "../images/cards/2-club-1.png";
import clubs_black_3 from "../images/cards/3-club-1.png";
import clubs_black_4 from "../images/cards/4-club-1.png";
import clubs_black_5 from "../images/cards/5-club-1.png";
import clubs_black_6 from "../images/cards/6-club-1.png";
import clubs_black_7 from "../images/cards/7-club-1.png";
import clubs_black_8 from "../images/cards/8-club-1.png";
import clubs_black_9 from "../images/cards/9-club-1.png";
import clubs_black_10 from "../images/cards/10-club-1.png";
import clubs_black_A from "../images/cards/A-club-1.png";
import clubs_black_J from "../images/cards/J-club-1.png";
import clubs_black_K from "../images/cards/K-club-1.png";
import clubs_black_Q from "../images/cards/Q-club-1.png";

import diamonds_blue_2 from "../images/cards/2-diamonds.png";
import diamonds_blue_3 from "../images/cards/3-diamonds.png";
import diamonds_blue_4 from "../images/cards/4-diamonds.png";
import diamonds_blue_5 from "../images/cards/5-diamonds.png";
import diamonds_blue_6 from "../images/cards/6-diamonds.png";
import diamonds_blue_7 from "../images/cards/7-diamonds.png";
import diamonds_blue_8 from "../images/cards/8-diamonds.png";
import diamonds_blue_9 from "../images/cards/9-diamonds.png";
import diamonds_blue_10 from "../images/cards/10-diamonds.png";
import diamonds_blue_A from "../images/cards/A-diamonds.png";
import diamonds_blue_J from "../images/cards/J-diamonds.png";
import diamonds_blue_K from "../images/cards/K-diamonds.png";
import diamonds_blue_Q from "../images/cards/Q-diamonds.png";


import diamonds_red_2 from "../images/cards/2-diamond-red.png";
import diamonds_red_3 from "../images/cards/3-diamond-red.png";
import diamonds_red_4 from "../images/cards/4-diamond-red.png";
import diamonds_red_5 from "../images/cards/5-diamond-red.png";
import diamonds_red_6 from "../images/cards/6-diamond-red.png";
import diamonds_red_7 from "../images/cards/7-diamond-red.png";
import diamonds_red_8 from "../images/cards/8-diamond-red.png";
import diamonds_red_9 from "../images/cards/9-diamond-red.png";
import diamonds_red_10 from "../images/cards/10-diamond-red.png";
import diamonds_red_A from "../images/cards/A-diamond-red.png";
import diamonds_red_J from "../images/cards/J-diamond-red.png";
import diamonds_red_K from "../images/cards/K-diamond-red.png";
import diamonds_red_Q from "../images/cards/Q-diamond-red.png";



import hearts_2 from "../images/cards/2 -hearts.png";
import hearts_3 from "../images/cards/3-hearts.png";
import hearts_4 from "../images/cards/4-hearts.png";
import hearts_5 from "../images/cards/5-hearts.png";
import hearts_6 from "../images/cards/6-hearts.png";
import hearts_7 from "../images/cards/7-hearts.png";
import hearts_8 from "../images/cards/8-hearts.png";
import hearts_9 from "../images/cards/9-hearts.png";
import hearts_10 from "../images/cards/10-hearts.png";
import hearts_A from "../images/cards/A-hearts.png";
import hearts_J from "../images/cards/J-hearts.png";
import hearts_K from "../images/cards/K-hearts.png";
import hearts_Q from "../images/cards/Q-hearts.png";



import spade_2 from "../images/cards/2-spade.png";
import spade_3 from "../images/cards/3-spade.png";
import spade_4 from "../images/cards/4-spade.png";
import spade_5 from "../images/cards/5-spade.png";
import spade_6 from "../images/cards/6-spade.png";
import spade_7 from "../images/cards/7-spade.png";
import spade_8 from "../images/cards/8-spade.png";
import spade_9 from "../images/cards/9-spade.png";
import spade_10 from "../images/cards/10-spade.png";
import spade_A from "../images/cards/A-spade.png";
import spade_J from "../images/cards/J-spade.png";
import spade_K from "../images/cards/K-spade.png";
import spade_Q from "../images/cards/Q-spade.png";

import card_back from "../images/cards/card_back.png";


 
export const getCards = (cardSRC: any, calssName?: string) => {
    return <img className={calssName ? calssName : " card-size "} src={cardSRC}></img>;
}

export const getCardSrc = (card_name: string) => {
    switch (card_name) {

        case "1":
            return clubs_black_2
        case "2":
            return clubs_black_3
        case "3":
            return clubs_black_4
        case "4":
            return clubs_black_5
        case "5":
            return clubs_black_6
        case "6":
            return clubs_black_7
        case "7":
            return clubs_black_8
        case "8":
            return clubs_black_9
        case "9":
            return clubs_black_10
        case "10":
            return clubs_black_J
        case "11":
            return clubs_black_Q
        case "12":
            return clubs_black_K
        case "13":
            return clubs_black_A

        case "clubs_green_2":
            return clubs_green_2
        case "clubs_green_3":
            return clubs_green_3
        case "clubs_green_4":
            return clubs_green_4
        case "clubs_green_5":
            return clubs_green_5
        case "clubs_green_6":
            return clubs_green_6
        case "clubs_green_7":
            return clubs_green_7
        case "clubs_green_8":
            return clubs_green_8
        case "clubs_green_9":
            return clubs_green_9
        case "clubs_green_10":
            return clubs_green_10
        case "clubs_green_A":
            return clubs_green_A
        case "clubs_green_J":
            return clubs_green_J
        case "clubs_green_K":
            return clubs_green_K
        case "clubs_green_Q":
            return clubs_green_Q

        case "diamonds_blue_2":
            return diamonds_blue_2
        case "diamonds_blue_3":
            return diamonds_blue_3
        case "diamonds_blue_4":
            return diamonds_blue_4
        case "diamonds_blue_5":
            return diamonds_blue_5
        case "diamonds_blue_6":
            return diamonds_blue_6
        case "diamonds_blue_7":
            return diamonds_blue_7
        case "diamonds_blue_8":
            return diamonds_blue_8
        case "diamonds_blue_9":
            return diamonds_blue_9
        case "diamonds_blue_10":
            return diamonds_blue_10
        case "diamonds_blue_A":
            return diamonds_blue_A
        case "diamonds_blue_J":
            return diamonds_blue_J
        case "diamonds_blue_K":
            return diamonds_blue_K
        case "diamonds_blue_Q":
            return diamonds_blue_Q

        case "14":
            return diamonds_red_2
        case "15":
            return diamonds_red_3
        case "16":
            return diamonds_red_4
        case "17":
            return diamonds_red_5
        case "18":
            return diamonds_red_6
        case "19":
            return diamonds_red_7
        case "20":
            return diamonds_red_8
        case "21":
            return diamonds_red_9
        case "22":
            return diamonds_red_10
        case "23":
            return diamonds_red_J
        case "24":
            return diamonds_red_Q
        case "25":
            return diamonds_red_K
        case "26":
            return diamonds_red_A


        case "27":
            return hearts_2
        case "28":
            return hearts_3
        case "29":
            return hearts_4
        case "30":
            return hearts_5
        case "31":
            return hearts_6
        case "32":
            return hearts_7
        case "33":
            return hearts_8
        case "34":
            return hearts_9
        case "35":
            return hearts_10
        case "36":
            return hearts_J
        case "37":
            return hearts_Q
        case "38":
            return hearts_K
        case "39":
            return hearts_A

        case "40":
            return spade_2
        case "41":
            return spade_3
        case "42":
            return spade_4
        case "43":
            return spade_5
        case "44":
            return spade_6
        case "45":
            return spade_7
        case "46":
            return spade_8
        case "47":
            return spade_9
        case "48":
            return spade_10
        case "49":
            return spade_J
        case "50":
            return spade_Q
        case "51":
            return spade_K
        case "52":
            return spade_A


        case "0":
            return card_back


        default:
            break;
    }

}