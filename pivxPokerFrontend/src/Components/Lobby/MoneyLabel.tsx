import styled from "styled-components";
import addMoneyIcon from "../../images/add-money-icon.png";
import Spacer from "../../StyledComponents/Spacer";
import TextExtraSmall from "../../StyledComponents/TextExtraSmall";
import TextSmall from "../../StyledComponents/TextSmall";

export interface MoneyLabelProps {
   text: string;
}

const MoneyLabelWrapper = styled.div`
   display: flex;
   border: solid 0.5px rgba(255, 255, 255, 0.28);
   background-color: rgba(0, 0, 0, 0.4);
   border-radius: 1rem;
   padding-right: 1rem;
   height: 34px;
   margin-right: 10px;
   margin-left: 10px;
`;

const MoneyLabel: React.FC<MoneyLabelProps> = ({ text }) => {
   return (
      <MoneyLabelWrapper>
         <Spacer elements="2" spacing="0.5rem">
            <img src={addMoneyIcon}></img>
            <TextExtraSmall>{text}</TextExtraSmall>
         </Spacer>
      </MoneyLabelWrapper>
   );
};

export default MoneyLabel;
