import styled from "styled-components";
import PokerLogo from "./PokerLogo";

const LogoDescription = styled.div`
   width: 400px;
   padding: 8.5px;
   text-align: center;
   color: white;
   margin-bottom: 32px;
   margin-left: 20px;
   font-family: Montserrat;
   font-weight: 900;
   font-size: 40px;
   @media (max-width: 700px) {
      width: 300px;
   }
   @media (max-width: 300px) {
      width: 250px;
   }
`;

const LogoDescriptionSub = styled.div`
    color: #130d1e;
    display: inline;
    font-family: Montserrat;
`;

const HomePageHeader: React.FC = () => {
   return (
      <>
         <PokerLogo></PokerLogo>
         <LogoDescription>
            PIVX<LogoDescriptionSub>.poker</LogoDescriptionSub>
         </LogoDescription>
      </>
   );
};

export default HomePageHeader;
