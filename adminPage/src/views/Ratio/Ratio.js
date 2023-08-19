import React, { useEffect, useState } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
import AccountCircle from "@material-ui/icons/AccountCircle";
import Dvr from "@material-ui/icons/Dvr";
import {
  ThumbUpAlt,
  ThumbDown,
  DeleteForever
} from "@material-ui/icons";
import Edit from "@material-ui/icons/Edit";
// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardIcon from "components/Card/CardIcon.js";
import CardHeader from "components/Card/CardHeader.js";
import { FetchContext } from "variables/authFetch";
import { useSnackbar } from 'notistack';
import CustomInput from "components/CustomInput/CustomInput.js";
import CircularProgress from '@material-ui/core/CircularProgress';
import Warning from "components/Typography/Warning.js";
import Danger from "components/Typography/Danger.js";
import Success from "components/Typography/Success.js";
import Primary from "components/Typography/Primary.js";
import Info from "components/Typography/Info.js";

import { AuthContext } from 'variables/auth';
import ReactTable from "components/ReactTable/ReactTable.js";
import SweetAlert from "react-bootstrap-sweetalert";
import { cardTitle } from "assets/jss/material-dashboard-pro-react.js";
import buttonStyle from "assets/jss/material-dashboard-pro-react/components/buttonStyle.js";
const styles = {
  ...buttonStyle,
  cardIconTitle: {
    ...cardTitle,
    marginTop: "15px",
    marginBottom: "0px"
  }
};

const useStyles = makeStyles(styles);

export default function Ratio(props) {
  const { authState } = React.useContext(AuthContext);
  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const [balanceUsers, setBalanceUsers]=useState(0);
  const [balanceWallet, setBallanceWallet]=useState(0);
  const [amount, setAmount]=useState(0);
  const [address, setAddress]=useState('');
  const classes = useStyles();


  const catchFunc = (err) => {
    if (err.response) {
      enqueueSnackbar(err.response.data.message, { variant: 'danger' });

    } else if (err.request) {
      enqueueSnackbar("Server is not responding", { variant: 'danger' });
      // client never received a response, or request never left
    } else {
      // anything else
      enqueueSnackbar("Server is not working", { variant: 'danger' });
    }
  };
  useEffect(() => {
    console.log(props);
    (async () => {
      try {
        const { data } = await authAxios.get(`/total-profit`).catch(err => {
          catchFunc(err);
        });
        setBalanceUsers(data.balanceUsers[0].amount);
        setBallanceWallet(data.balanceWallet);
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, []);
  const withdraw=async ()=>{
    try {
      const { data } = await authAxios.post(`/profit-withdraw`,{address, amount}).catch(err => {
        catchFunc(err);
      });
      enqueueSnackbar(data.message, { variant: 'success' });
    } catch (err) {
      catchFunc(err);
    }
  };
  return (
    <GridContainer>
      <GridItem xs={12}>
        {alert}
        <Card>
          <CardHeader color="primary" icon>
            <CardIcon color="primary">
              <AccountCircle />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Total Profit</h4>
          </CardHeader>
          <CardBody>
            <GridContainer>
              <GridItem xs={12}>
                <h6>Total balance of users</h6>
              </GridItem>
              <GridItem xs={12}>
                {balanceUsers} satoshies
              </GridItem>
            </GridContainer>
            <GridContainer>
            <GridItem xs={12}>
              <h6>Total balance of your server wallet</h6>
            </GridItem>
            <GridItem xs={12}>
              {(balanceWallet*100000000).toFixed(0)} satoshies
            </GridItem>

          </GridContainer>
          <GridContainer>
              <GridItem xs={12}>
                <h6>Profit</h6>
              </GridItem>
              <GridItem xs={12}>
              {(balanceWallet*100000000-balanceUsers).toFixed(0)} satoshies
              </GridItem>
            </GridContainer>
            <hr />
            <GridContainer>
              <GridItem xs={12}>
                <h6>Withdraw amount & address</h6>
              </GridItem>
              <GridItem xs={12} sm={6}>
                <CustomInput
                  labelText="amount"
                  id="amount"
                  formControlProps={{
                    fullWidth: true
                  }}
                  inputProps={{
                    type: "number",
                    value:amount,
                    onChange: (e) => { setAmount(e.target.value) }
                  }}
                />
              </GridItem>
              <GridItem xs={12} sm={6}>
                <CustomInput
                  labelText="address"
                  id="address"
                  formControlProps={{
                    fullWidth: true
                  }}
                  inputProps={{
                    type: "text",
                    value:address,
                    onChange: (e) => { setAddress(e.target.value) }
                  }}
                />
              </GridItem>
            </GridContainer>
            <Button color="rose" onClick={withdraw}>Withdraw</Button>
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer >
  );
}
