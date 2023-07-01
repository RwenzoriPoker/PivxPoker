import styled from "styled-components";
import logo from "./poker-logo.png";

const PokerLogoSC = styled.div`
   width: 150.1px;
   text-align: center;
   color: rgb(233, 144, 44);
   text-shadow: rgb(204, 127, 39) 1px 1px, rgb(135, 45, 15) 3px 3px;
   font-size: 4rem;
   font-weight: bold;
`;

const PokerLogo: React.FC = () => {
   return <img className="pix-logo" src={logo} />;
};

export default PokerLogo;
