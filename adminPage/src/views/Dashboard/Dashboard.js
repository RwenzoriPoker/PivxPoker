import React, { useState, useEffect } from "react";
// react plugin for creating charts
import ChartistGraph from "react-chartist";
// react plugin for creating vector maps
import Datetime from "react-datetime";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons

import {
  GetApp,
  People,
  ExitToApp,
  Money,
  BarChart,
  Timeline,
} from "@material-ui/icons";

import DateRange from "@material-ui/icons/DateRange";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import { FetchContext } from "variables/authFetch";
import { useSnackbar } from "notistack";
import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";
var Chartist = require("chartist");

const useStyles = makeStyles(styles);
const to = new Date();
const from = new Date();
from.setDate(from.getDate() - 6);
const dateRanges = [];
for (let i = 0; i < 7; i++) {
  const current = new Date(from);
  current.setDate(current.getDate() + i);
  dateRanges.push(
    current.getMonth() +
      1 +
      "/" +
      current.getDate() +
      "/" +
      current.getFullYear()
  );
}
var delays = 80,
  durations = 500;
var delays2 = 80,
  durations2 = 500;
export default function Dashboard() {
  const [totalUsers, setTotalUsers] = useState("");
  const [totalVisits, setTotalVisits] = useState("");
  const [totalRecharge, setTotalRecharge] = useState("");
  const [totalWithdraw, setTotalWithdraw] = useState("");
  const [balance, setBalance] = useState("");


  const [fromVisit, setFromVisit] = useState(from);
  const [toVisit, setToVisit] = useState(to);


  const [fromRecharges, setFromRecharges] = useState(from);
  const [toRecharges, setToRecharges] = useState(to);

  const [recharges, setRecharges] = useState({
    data: {
      labels: dateRanges,
      series: [[], []],
    },
    options: {
      lineSmooth: Chartist.Interpolation.cardinal({
        tension: 0,
      }),
      axisY: {
        showGrid: true,
        offset: 100,
      },
      axisX: {
        showGrid: false,
      },
      low: 0,
      high: 10,
      showPoint: true,
      height: "300px",
    },
    animation: {
      draw: function (data) {
        if (data.type === "line" || data.type === "area") {
          data.element.animate({
            d: {
              begin: 600,
              dur: 700,
              from: data.path
                .clone()
                .scale(1, 0)
                .translate(0, data.chartRect.height())
                .stringify(),
              to: data.path.clone().stringify(),
              easing: Chartist.Svg.Easing.easeOutQuint,
            },
          });
        } else if (data.type === "point") {
          data.element.animate({
            opacity: {
              begin: (data.index + 1) * delays,
              dur: durations,
              from: 0,
              to: 1,
              easing: "ease",
            },
          });
        }
      },
    },
  });

  const [visits, setVisits] = useState({
    data: {
      labels: dateRanges,
      series: [[], []],
    },
    options: {
      seriesBarDistance: 10,
      axisX: {
        showGrid: false,
      },
      height: "300px",
    },
    responsiveOptions: [
      [
        "screen and (max-width: 640px)",
        {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc: function (value) {
              return value[0];
            },
          },
        },
      ],
    ],
    animation: {
      draw: function (data) {
        if (data.type === "bar") {
          data.element.animate({
            opacity: {
              begin: (data.index + 1) * delays2,
              dur: durations2,
              from: 0,
              to: 1,
              easing: "ease",
            },
          });
        }
      },
    },
  });

  const [visitsDown, setVisitsDown] = useState("");
  const [rechargesDownload, setRechargesDownload] = useState("");

  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const catchFunc = (err) => {
    console.log(err);
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

  const downVisits = async () => {
    const element = document.createElement("a");
    const file = new Blob([visitsDown], { type: "application/text" });
    element.href = URL.createObjectURL(file);
    element.download = "Visits.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const downRecharges = async () => {
    const element = document.createElement("a");
    const file = new Blob([rechargesDownload], { type: "application/text" });
    element.href = URL.createObjectURL(file);
    element.download = "Deposit/Withdraw.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAxios.get("/admin/total");
        if (data) {
          setTotalUsers(data.users);
          setTotalVisits(data.visits);
          setTotalRecharge(data.recharges);
          setTotalWithdraw(data.withdraws);
          setBalance(data.balance);
        }
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, []);


  useEffect(() => {
    let fromDate = new Date(fromVisit);
    const fromD =
      fromDate.getFullYear() +
      "-" +
      (fromDate.getMonth() + 1) +
      "-" +
      fromDate.getDate();
    let toDate = new Date(toVisit);
    const toD =
      toDate.getFullYear() +
      "-" +
      (toDate.getMonth() + 1) +
      "-" +
      toDate.getDate();
    const dateRanges = [];
    const dates = Math.ceil((toDate - fromDate) / (3600000 * 24));
    for (let i = 0; i <= dates; i++) {
      const current = new Date(fromDate);
      current.setDate(current.getDate() + i);
      dateRanges.push(
        current.getMonth() +
          1 +
          "/" +
          current.getDate() +
          "/" +
          current.getFullYear()
      );
    }
    (async () => {
      try {
        const { data } = await authAxios.get(`/admin/visits/${fromD}/${toD}`);
        if (data) {
          const low = Math.min(...data.visits, ...data.users);
          const high = Math.max(...data.visits, ...data.users);
          setVisits({
            ...visits,
            data: {
              labels: dateRanges,
              series: [data.visits, data.users],
            },
            options: {
              ...visits.options,
              low,
              high,
            },
          });
          let content = `Visits/New joiners History\n`;
          content += `Date\t Visits\t New Joiner\n`;
          for (let i = 0; i <= dates; i++) {
            const current = new Date(fromDate);
            current.setDate(current.getDate() + i);
            content +=
              current.getMonth() +
              1 +
              "/" +
              current.getDate() +
              "/" +
              current.getFullYear() +
              "\t" +
              data.visits[i] +
              "\t" +
              data.users[i];
            content += "\n";
          }
          setVisitsDown(content);
        }
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, [fromVisit, toVisit]);

  useEffect(() => {
    let fromDate = new Date(fromRecharges);
    const fromD =
      fromDate.getFullYear() +
      "-" +
      (fromDate.getMonth() + 1) +
      "-" +
      fromDate.getDate();
    let toDate = new Date(toRecharges);
    const toD =
      toDate.getFullYear() +
      "-" +
      (toDate.getMonth() + 1) +
      "-" +
      toDate.getDate();
    const dateRanges = [];
    const dates = Math.ceil((toDate - fromDate) / (3600000 * 24));
    for (let i = 0; i <= dates; i++) {
      const current = new Date(fromDate);
      current.setDate(current.getDate() + i);
      dateRanges.push(
        current.getMonth() +
          1 +
          "/" +
          current.getDate() +
          "/" +
          current.getFullYear()
      );
    }
    (async () => {
      try {
        const { data } = await authAxios.get(
          `/admin/recharges/${fromD}/${toD}`
        );
        if (data) {
          const low = Math.min(...data.recharges, ...data.withdraws);
          const high = Math.max(...data.recharges, ...data.withdraws);
          await setRecharges({
            ...recharges,
            data: {
              labels: dateRanges,
              series: [data.recharges, data.withdraws],
            },
            options: {
              ...recharges.options,
              low,
              high,
            },
          });
          let content = `Recharges History\n`;
          content += `Date\t Recharges\t Withdraws\n`;
          for (let i = 0; i < dates; i++) {
            const current = new Date(fromDate);
            current.setDate(current.getDate() + i);
            content +=
              current.getMonth() +
              1 +
              "/" +
              current.getDate() +
              "/" +
              current.getFullYear() +
              "\t" +
              data.recharges[i]+
              "\t" +data.withdraws[i];
            content += "\n";
          }
          setRechargesDownload(content);
        }
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, [fromRecharges, toRecharges]);
  
  // console.log(visits.data.series[0]);
  // console.log(visits.data.series[0].reduce((all, ele) => all + parseFloat(ele), 0).toFixed(0));
  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={12} md={6} lg={6}>
          <Card>
            <CardHeader color="warning" stats icon>
              <CardIcon color="warning">
                <People />
              </CardIcon>
              <p className={classes.cardCategory}>Total players</p>
              <h3 className={classes.cardTitle}>{totalUsers}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                {to.getFullYear() +
                  "-" +
                  (to.getMonth() + 1) +
                  "-" +
                  to.getDate()}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={6} lg={6}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <ExitToApp />
              </CardIcon>
              <p className={classes.cardCategory}>Total visits</p>
              <h3 className={classes.cardTitle}>{totalVisits}</h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                {to.getFullYear() +
                  "-" +
                  (to.getMonth() + 1) +
                  "-" +
                  to.getDate()}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={6} lg={6}>
          <Card>
            <CardHeader color="info" stats icon>
              <CardIcon color="info">
                <Money />
              </CardIcon>
              <p className={classes.cardCategory}>Total Balance</p>
              <h3 className={classes.cardTitle}>
                {balance[0] ? balance[0].amount : 0} satoshies
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                {to.getFullYear() +
                  "-" +
                  (to.getMonth() + 1) +
                  "-" +
                  to.getDate()}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={6} lg={6}>
          <Card>
            <CardHeader color="info" stats icon>
              <CardIcon color="info">
                <Money />
              </CardIcon>
              <p className={classes.cardCategory}>Total Deposit</p>
              <h3 className={classes.cardTitle}>
                {totalRecharge[0] ? totalRecharge[0].amount : 0} satoshies
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                {to.getFullYear() +
                  "-" +
                  (to.getMonth() + 1) +
                  "-" +
                  to.getDate()}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={6} lg={6}>
          <Card>
            <CardHeader color="info" stats icon>
              <CardIcon color="info">
                <Money />
              </CardIcon>
              <p className={classes.cardCategory}>Total Withdraw</p>
              <h3 className={classes.cardTitle}>
                {totalWithdraw[0] ? totalWithdraw[0].amount : 0} satoshies
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                {to.getFullYear() +
                  "-" +
                  (to.getMonth() + 1) +
                  "-" +
                  to.getDate()}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>
      <GridContainer>        
        <GridItem xs={12} sm={12} md={12}>
          <Card>
            <CardHeader color="rose" icon>
              <CardIcon color="rose">
                <BarChart />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>
                Visitors / New{" "}
                <small>
                  -{" "}
                  {visits.data.series[0].reduce(
                    (all, ele) => all + parseInt(ele),
                    0
                  )}{" "}
                  /{" "}
                  {visits.data.series[1].reduce(
                    (all, ele) => all + parseInt(ele),
                    0
                  )}
                </small>
                <span className={classes.datePickers}>
                  <Datetime
                    timeFormat={false}
                    inputProps={{ placeholder: "From" }}
                    className={classes.datePicker}
                    closeOnSelect={true}
                    value={fromVisit}
                    onChange={(e) => {
                      setFromVisit(e);
                    }}
                  />
                  <Datetime
                    timeFormat={false}
                    inputProps={{ placeholder: "To" }}
                    className={classes.datePicker}
                    closeOnSelect={true}
                    value={toVisit}
                    onChange={(e) => {
                      setToVisit(e);
                    }}
                  />
                  <Button justIcon color="info" simple onClick={downVisits}>
                    <GetApp />
                  </Button>
                </span>
              </h4>
            </CardHeader>
            <CardBody>
              <ChartistGraph
                data={visits.data}
                type="Bar"
                options={visits.options}
                listener={visits.animation}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={12}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Timeline />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>
                Deposits / Withdraws{" "}
                <small>
                  {" "}
                  :{" "}
                  <span style={{ color: "#00bcd4", marginLeft: "10px" }}>
                    {recharges.data.series[0]
                      .reduce((all, ele) => all + parseFloat(ele), 0)
                      .toFixed(0)}{" "}
                     / {recharges.data.series[1]
                      .reduce((all, ele) => all + parseFloat(ele), 0)
                      .toFixed(0)}{" "} satoshies
                  </span>
                </small>
                <span className={classes.datePickers}>
                  <Datetime
                    timeFormat={false}
                    inputProps={{ placeholder: "From" }}
                    className={classes.datePicker}
                    closeOnSelect={true}
                    value={fromRecharges}
                    onChange={(e) => {
                      setFromRecharges(e);
                    }}
                  />
                  <Datetime
                    timeFormat={false}
                    inputProps={{ placeholder: "To" }}
                    className={classes.datePicker}
                    closeOnSelect={true}
                    value={toRecharges}
                    onChange={(e) => {
                      setToRecharges(e);
                    }}
                  />
                  <Button justIcon color="info" simple onClick={downRecharges}>
                    <GetApp />
                  </Button>
                </span>
              </h4>
              <div></div>
            </CardHeader>
            <CardBody>
              <ChartistGraph
                data={recharges.data}
                type="Line"
                options={recharges.options}
                listener={recharges.animation}
              />
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
      <GridContainer></GridContainer>
    </div>
  );
}