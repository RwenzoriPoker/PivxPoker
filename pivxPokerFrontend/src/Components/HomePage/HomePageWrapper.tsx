import styled from "styled-components";
import background from "./background.png";

const Wrapper = styled.div`
   height: 100%;
   width:100%;
   display: flex;
   align-items: center;
   justify-content: center;
   background-size: cover;
   background-repeat: no-repeat;
`;
const HomePageWrapper: React.FC = ({ children }) => {
   return (
      <Wrapper style={{ background: `url('https://cdn.discordapp.com/attachments/1115875015330648156/1139836771660730368/grid_recolored_retouched.svg')` }}>
         {children}
      </Wrapper>
   );
};

export default HomePageWrapper;
