import React, { useState, useEffect } from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// material-ui icons
import Assignment from "@material-ui/icons/Assignment";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Table from "components/Table/Table.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import { FetchContext } from "variables/authFetch";
import { useSnackbar } from "notistack";
import { cardTitle } from "assets/jss/material-dashboard-pro-react.js";

const styles = {
  customCardContentClass: {
    paddingLeft: "0",
    paddingRight: "0",
  },
  cardIconTitle: {
    ...cardTitle,
    marginTop: "15px",
    marginBottom: "0px",
  },
};

const useStyles = makeStyles(styles);

export default function Raffles() {
  const classes = useStyles();
  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const [hourlyTickets, setHourlyTickets] = useState([]);
  const [dailyTickets, setDailyTickets] = useState([]);
  const [weeklyTickets, setWeeklyTickets] = useState([]);
  const [hourlyBets, setHourlyBets] = useState([]);
  const [dailyBets, setDailyBets] = useState([]);
  const [weeklyBets, setWeeklyBets] = useState([]);
  const catchFunc = (err) => {
    if (err.response) {
      enqueueSnackbar(err.response.data.message, { variant: "danger" });
    } else if (err.request) {
      enqueueSnackbar("Server is not responding", { variant: "danger" });
      // client never received a response, or request never left
    } else {
      // anything else
      enqueueSnackbar("Server is not working", { variant: "danger" });
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAxios.get("/admin/raffles");
        if (data) {
          setHourlyBets(data.hourlyBets);
          setDailyBets(data.dailyBets);
          setWeeklyBets(data.weeklyBets);
          setHourlyTickets(data.hourlyTickets);
          setDailyTickets(data.dailyTickets);
          setWeeklyTickets(data.weeklyTickets);
        }
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, []);
  return (
    <GridContainer>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Hourly Raffle Tickets</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Place", "Ticket", "Prize"]}
              tableData={hourlyTickets.map((ele) => [
                ele.place,
                ele.ticket,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Hourly Raffle Status</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Ticket", "Player", "Place", "Prize"]}
              tableData={hourlyBets.map((ele) => [
                ele.ticket,
                ele.email,
                ele.place,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Daily Raffle Tickets</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Place", "Ticket", "Prize"]}
              tableData={dailyTickets.map((ele) => [
                ele.place,
                ele.ticket,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Daily Raffle Status</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Ticket", "Player", "Place", "Prize"]}
              tableData={dailyBets.map((ele) => [
                ele.ticket,
                ele.email,
                ele.place,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Weekly Raffle Tickets</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Place", "Ticket", "Prize"]}
              tableData={weeklyTickets.map((ele) => [
                ele.place,
                ele.ticket,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              <Assignment />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Weekly Raffle Status</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Ticket", "Player", "Place", "Prize"]}
              tableData={weeklyBets.map((ele) => [
                ele.ticket,
                ele.email,
                ele.place,
                ele.prize,
              ])}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer>
  );
}