import styled from "styled-components";
import Button from "../../StyledComponents/Button";
import TextExtraSmall from "../../StyledComponents/TextExtraSmall";
import TextSmall from "../../StyledComponents/TextSmall";
import { TableHeadItem } from "./CashTable";

const LobbyDetailsWrapper = styled.div`
   display: flex;
   flex-direction: column;
   width: 25%;
   border-left: 2px solid #2d3746;
   height: 100%;
   align-items: center;
`;
const DetailRowsWrapper = styled.div`
   display: flex;
   flex-direction: column;
   padding: 1rem 2rem;
   line-height: 2.5;
`;

const DetailRow = styled.div`
   display: flex;
   justify-content: space-between;
`;

interface IDetail {
   name: string;
   money: number;
}

const details: IDetail[] = [
   { name: "Rupesh Singh", money: 1200 },
   { name: "Harshad Patil", money: 1500 },
   { name: "Target gima", money: 1500 },
   { name: "Ramu Nandana", money: 15000 },
   { name: "Test User", money: 1000 },
];

const LobbyDetails: React.FC = () => {
   return (
      <LobbyDetailsWrapper>
         <TableHeadItem>deatils</TableHeadItem>
         <DetailRowsWrapper>
            {details.map((data, i) => (
               <DetailRow key={i} >
                  <TextExtraSmall>{data.name}</TextExtraSmall>
                  <TextExtraSmall>{data.money}</TextExtraSmall>
               </DetailRow>
            ))}
         </DetailRowsWrapper>
         <Button style={{ width: 150 }} size="small" variant="yellow">
            <TextSmall>Open Table</TextSmall>
         </Button>
      </LobbyDetailsWrapper>
   );
};

export default LobbyDetails;


// <div className="lobby-details">
// <div className="tabel-item head-item">deatils</div>
// <div className="lobby-details-wrapper">
//    {details.map((data ,i) => (
//       <div className="lobby-details-row" key={i}>
//          <TextExtraSmall>{data.name}</TextExtraSmall>
//          <TextExtraSmall>{data.money}</TextExtraSmall>
//       </div>
//    ))}
// </div>
// <Button style={{ width: 150 }} size="small" variant="yellow">
//    <TextSmall>Open Table</TextSmall>
// </Button>
// </div>