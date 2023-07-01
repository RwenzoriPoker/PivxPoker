import styled from "styled-components";
import LobbySmallTabButton from "../../StyledComponents/LobbySmallTabButton";

const LobbySmallTabsWrapper = styled.div`
   display: grid;
   max-width: 50%;
   grid-template-rows: 1fr 1fr;
   grid-template-columns: repeat(7, 1fr);
   grid-gap: 0.25rem;
   padding: 0.5rem 2rem;
`;

const tabs = [
   { label: "No limit", active: false },
   { label: "Pot limit", active: true },
   { label: "Limit", active: false },
   { label: "Micro", active: false },
   { label: "Low", active: false },
   { label: "Mid", active: true },
   { label: "High", active: false },
   { label: "Holden", active: false },
   { label: "Ohama", active: false },
   { label: "Stud", active: false },
   { label: "Draw", active: true },
   { label: "Mixed", active: false },
   { label: "OFC", active: false },
   { label: "Big Two", active: false },
];

const LobbySmallTabs: React.FC = () => {
   return (
      <LobbySmallTabsWrapper>
         {tabs.map(({ label, active },i) => (
            <LobbySmallTabButton  key={i} active={active}>{label}</LobbySmallTabButton>
         ))}
      </LobbySmallTabsWrapper>
   );
};

export default LobbySmallTabs;
