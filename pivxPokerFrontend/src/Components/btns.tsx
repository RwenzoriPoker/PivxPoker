import back_btn from "../images/back_btn.jpg";
import menu_square_btn from "../images/menu_square_btn.jpg";
import info_btn from "../images/info_btn.jpg";
import currancy_btn from "../images/currancy_btn.jpg";
import settings_btn from "../images/settings_btn.jpg";
import times_btn from "../images/times_btn.jpg";
import R_btn from "../images/R_btn.jpg";
import location_btn from "../images/location_btn.png";
import coin_btn from "../images/coin_btn.png";
import chips_icon from "../images/chips_icon.png";


export const TimesBtn: React.FC = () => {
    return <img className="menu-icon" src={times_btn}></img>;
 };
 export const SettingsBtn: React.FC = () => {
    return <img className="menu-icon" src={settings_btn}></img>;
 };
 export const CurrancyBtn: React.FC = () => {
    return <img className="menu-icon" src={currancy_btn}></img>;
 };
 export const InfoBtn: React.FC = () => {
    return <img className="menu-icon" src={info_btn}></img>;
 };
 export const MenuSquareBtn: React.FC = () => {
    return <img className="menu-icon" src={menu_square_btn}></img>;
 };
 export const RBtn: React.FC = () => {
    return <img className="menu-icon" src={R_btn}></img>;
 };
 export const BackBtn: React.FC = () => {
    return <img className="menu-icon" src={back_btn}></img>;
 };
 export const LocationBtn: React.FC = () => {
   return <img className="menu-icon" src={location_btn}></img>;
};
export const CoinBtn: React.FC = () => {
   return <img className="menu-icon" src={coin_btn}></img>;
};
export const ChipsIcon: React.FC = () => {
   return <img className="menu-icon float-left" src={chips_icon}></img>;
};