import styled from "styled-components";
import background from "./background.png";

const Wrapper = styled.div`
   height: 100%;
   display: flex;
   align-items: center;
   justify-content: center;
   background-size: cover;
   background-repeat: no-repeat;
`;
const HomePageWrapper: React.FC = ({ children }) => {
   return (
      <Wrapper style={{ background: `linear-gradient(101deg, #430e70, #4D3077), #662D91` }}>
         {children}
      </Wrapper>
   );
};

export default HomePageWrapper;
