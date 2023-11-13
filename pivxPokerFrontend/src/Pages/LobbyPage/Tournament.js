import styled from "styled-components";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import handleToast, { success } from "../../Components/toast";
import { useHistory } from "react-router-dom";

import { withRouter } from "react-router-dom";
import {
  showKilo,
  showTurnTime,
  showTableSize,
  showDot,
} from "../../shared/printConfig";
import {
  AiOutlineClose,
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiTwotoneLock,
  AiOutlineCheck,
} from "react-icons/ai";

const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TableHeadRow = styled.div`
  display: flex;
  width: 100%;
  background-color: #2d3746;
  color: #ffffff;
  justify-content: flex-start;
  cursor: pointer;
`;
const TableItem = styled.div`
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 0.75rem 0;
  font-family: Montserrat, Helvetica Neue, sans-serif;
  text-align: center;
  width: 20%;
  color: white;
`;

export const TableHeadItem = styled(TableItem)`
  color: #ffffff;
  background: #662D91;
  box-shadow: 2px 3px 1px rgba(0,0,0,0.4);
  text-transform: uppercase;
  width: 100%;
  text-align: center;
`;

const PanelTableRow = styled(TableHeadRow)`
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  :hover {
    background: #2a1b42;
  }
`;

const LobbyPage = (props) => {
  const history=useHistory();
  const [sort, setSort] = useState("");
  const headings = ["Name", "Buy In", "Prize Pool", "Players", "Status"];
  const [tableItems, setTableItems] = useState(props.tournaments);
  const handleSort = (text) => {
    if (sort.name === text) {
      setSort({
        name: text,
        type: !sort.type,
      });
    } else {
      setSort({
        name: text,
        type: true,
      });
    }
  };
  useEffect(() => {
    console.log(props)
    setTableItems(props.tournaments);
    //console.log(props.sitGames);
  }, [props.tournaments]);
  useEffect(() => {
    const data = JSON.parse(JSON.stringify(tableItems));
    if (data.length > 0) {
      data.sort((a, b) => {
        if (sort.name === "Name") {
          var x = a.name.toLowerCase();
          var y = b.name.toLowerCase();
          if (sort.type) {
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          } else {
            if (x < y) {
              return 1;
            }
            if (x > y) {
              return -1;
            }
            return 0;
          }
        } else if (sort.name === "Buy In") {
          var x = a.buyIn;
          var y = b.buyIn;
          if (sort.type) {
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          } else {
            if (x < y) {
              return 1;
            }
            if (x > y) {
              return -1;
            }
            return 0;
          }
        } else if (sort.name === "Prize Pool") {
          var x = a.firstPlace+a.secondPlace+a.thirdPlace;
          var y = b.firstPlace+b.secondPlace+b.thirdPlace;
          if (sort.type) {
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          } else {
            if (x < y) {
              return 1;
            }
            if (x > y) {
              return -1;
            }
            return 0;
          }
        } else if (sort.name === "Players") {
          var x = parseInt(a.playersCount);
          var y = parseInt(b.playersCount);
          if (sort.type) {
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          } else {
            if (x < y) {
              return 1;
            }
            if (x > y) {
              return -1;
            }
            return 0;
          }
        } else if (sort.name === "Status") {
          var x = a.status;
          var y = b.status;
          if (sort.type) {
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          } else {
            if (x < y) {
              return 1;
            }
            if (x > y) {
              return -1;
            }
            return 0;
          }
        } else return 1;
      });
      setTableItems(data);
    }
  }, [sort]);
  const goToGames = (id) => {
    history.push("/games/sit/" + id);

  };

  return (
    <div className="lobby">
      <div className="table-wrapper">
        <div className="table-row w100">
          {headings.map((text, i) => (
            <div className="tabel-item head-item" key={i} onClick={(e) => handleSort(text)}>
            {text}
            {sort.name === text ? (
              sort.type === true ? (
                <AiOutlineArrowUp />
              ) : (
                <AiOutlineArrowDown />
              )
            ) : (
              ""
            )}
            </div>
          ))}
        </div>
        {tableItems
        ? tableItems
            .map((ele) => {
              const item = {};
              item.id = ele.id;
              item.privacy = ele.privacy;
              item.current = ele.current;
              item.name = ele.name;
              item.buyIn = showKilo(ele.buyIn);
              item.prizePool = showKilo(ele.firstPlace+ele.secondPlace+ele.thirdPlace);
              item.tableSize = ele.playersCount + "/" + ele.tableSize;
              item.status = ele.status;
              item.limit = ele.limit;
              item.playing=ele.playing ? "Playing" : ele.closed ? "Closed" : "Registering";
              return item;
            })
            .map((item, i) => (
              <PanelTableRow key={item.id}>
                <TableItem onClick={() => goToGames(item.id)}>
                  {item.current ? <AiOutlineCheck /> : ""}{" "}
                  {item.privacy ? <AiTwotoneLock /> : ""} {item.name + " "}
                  {item.limit ? (
                    <small
                      style={{
                        fontWeight: "100",
                        fontStyle: "italic",
                        fontSize: "10px",
                      }}
                    >
                      ( Pot limited )
                    </small>
                  ) : (
                    ""
                  )}
                </TableItem>
                <TableItem onClick={() => goToGames(item.id)}>
                  {item.buyIn}
                </TableItem>
                <TableItem onClick={() => goToGames(item.id)}>
                  {item.prizePool}
                </TableItem>
                <TableItem onClick={() => goToGames(item.id)}>
                  {item.tableSize}
                </TableItem>
                <TableItem onClick={() => goToGames(item.id)}>
                  {item.playing}
                </TableItem>
              </PanelTableRow>
            ))
        : ""}
      Work in progress
        <hr />
      <div style={{textAlign:'center'}}>
      </div>
      </div>
      
    </div>
  );
};

const mapStateToProps = (state) => ({
  currentTab: state.LobbyReducer.currentTab,
  tabList: state.LobbyReducer.tabList,
  mobileView: state.LobbyReducer.mobileView,
});

export default withRouter(connect(mapStateToProps)(LobbyPage));
