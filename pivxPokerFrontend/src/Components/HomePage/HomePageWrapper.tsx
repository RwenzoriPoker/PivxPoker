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
      <Wrapper style={{ background: `url('https://cdn.discordapp.com/attachments/789310651679244288/1150490979254685856/gridanimatedv3.svg')` }}>
         {children}
      </Wrapper>
   );
};

export default HomePageWrapper;
