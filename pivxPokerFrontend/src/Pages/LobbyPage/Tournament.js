import styled from "styled-components";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";
import Button from "../../Components/Button";

import * as lobbyAction from "../../store/actions/lobby.action";
import LobbySmallTabButton from "../../StyledComponents/LobbySmallTabButton";
import TextSmall from "../../StyledComponents/TextSmall";
import { withRouter } from "react-router-dom";

const LobbyPage = (props) => {
  const [sort, setSort] = useState("");
  const headings = ["Name", "Buy In", "Prize Pool", "Players", "Status"];
  const [tableItems, setTableItems] = useState([
    ["testing_1", "10", "1000", "0/9", "Running"],
    ["testing_2", "10", "25k", "0/9", "58 Mins"],
    ["testing_3", "20", "20k", "0/9", "58 Mins"],
  ]);
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
    const data = JSON.parse(JSON.stringify(tableItems));
    data.sort((a, b) => {
      if (sort.name === "Name") {
        var x = a[0].toLowerCase();
        var y = b[0].toLowerCase();
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
        var x = a[1];
        var y = b[1];
        x = x.endsWith("k") ? parseInt(x) * 1000 : x;
        y = y.endsWith("k") ? parseInt(y) * 1000 : y;
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
        var x = a[2];
        var y = b[2];
        x = x.endsWith("k") ? parseInt(x) * 1000 : x;
        y = y.endsWith("k") ? parseInt(y) * 1000 : y;
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
        var x = parseInt(a.seats.split("/")[0]);
        var y = parseInt(b.seats.split("/")[0]);
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
        var x = a[0].toLowerCase();
        var y = b[0].toLowerCase();
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
      }
    });
    setTableItems(data);
    return () => {};
  }, [sort]);
  const openTournament = (item) => {
    console.log(item, props);
    props.history.push("/tournament_details");
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
        {
        //   tableItems.map((item, i) => (
        //   <div
        //     className=" table-row body-row"
        //     onClick={(e) => openTournament(item)}
        //     key={i}
        //   >
        //     {item.map((text, i) => (
        //       <div className="tabel-item ml-4" key={i}>
        //         {text}
        //       </div>
        //     ))}
        //   </div>
        // ))
      }
      Coming Soon
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
