import styled from "styled-components";

const Footer = styled.div`
   bottom: 0;
   position: absolute;
   left: 50%;
   transform: translate(-50%, -50px);
   color: white;
`;
const HomePageFooter: React.FC = () => {
   return <Footer></Footer>;
};

export default HomePageFooter;
