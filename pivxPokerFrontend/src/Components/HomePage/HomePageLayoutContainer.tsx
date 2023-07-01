import { Link } from "react-router-dom";
import styled from "styled-components";
import HomePageFooter from "./HomePageFooter";
import HomePageHeader from "./HomePageHeader";
import HomePageWrapper from "./HomePageWrapper";

export interface HomePageLayoutContainerProps {
   includeFooter?: boolean;
}

export const HomePageCenter = styled.div`
   display: flex;
   flex-direction: column;
   align-items: center;
   height: 100%;
   padding: 50px;
`;

const HomePageLayoutContainer: React.SFC<HomePageLayoutContainerProps> = ({
   children,
   includeFooter,
}) => {
   return (
      <HomePageWrapper>
         <HomePageCenter>
            <HomePageHeader></HomePageHeader>
            {children}
         </HomePageCenter>
         <HomePageFooter></HomePageFooter>
      </HomePageWrapper>
   );
};

export default HomePageLayoutContainer;
