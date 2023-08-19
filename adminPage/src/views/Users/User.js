import React, { useEffect, useState } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
import AccountCircle from "@material-ui/icons/AccountCircle";
import Dvr from "@material-ui/icons/Dvr";
import { ThumbUpAlt, ThumbDown, DeleteForever } from "@material-ui/icons";
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
import { useSnackbar } from "notistack";
import CustomInput from "components/CustomInput/CustomInput.js";
import CircularProgress from "@material-ui/core/CircularProgress";
import Warning from "components/Typography/Warning.js";
import Danger from "components/Typography/Danger.js";
import Success from "components/Typography/Success.js";
import Primary from "components/Typography/Primary.js";
import Info from "components/Typography/Info.js";

import { AuthContext } from "variables/auth";
import ReactTable from "components/ReactTable/ReactTable.js";
import SweetAlert from "react-bootstrap-sweetalert";
import { cardTitle } from "assets/jss/material-dashboard-pro-react.js";
import buttonStyle from "assets/jss/material-dashboard-pro-react/components/buttonStyle.js";
const styles = {
  ...buttonStyle,
  cardIconTitle: {
    ...cardTitle,
    marginTop: "15px",
    marginBottom: "0px",
  },
};

const useStyles = makeStyles(styles);

export default function User(props) {
  const { authState } = React.useContext(AuthContext);
  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const id = props.match.params.id;
  const [user, setUser] = useState("");
  const [recharges, setRecharges] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [enjoys, setEnjoys] = useState([]);
  const [balanceEditable, setBalanceEditable] = useState(false);
  const [balance, setBalance] = useState("");
  const classes = useStyles();
  const [alert, setAlert] = React.useState(null);
  console.log(props);
  const pointUp = async () => {
    try {
      const { data } = await authAxios.put(`/pointUp/${id}`).catch((err) => {
        catchFunc(err);
      });
      console.log(data);
      setUser(data);
    } catch (err) {
      catchFunc(err);
    }
  };

  const pointDown = async () => {
    try {
      const { data } = await authAxios.put(`/pointDown/${id}`).catch((err) => {
        catchFunc(err);
      });
      setUser(data);
    } catch (err) {
      catchFunc(err);
    }
  };

  const remove = () => {
    setAlert(
      <SweetAlert
        warning
        style={{ display: "block", marginTop: "-100px" }}
        title="Are you sure remove this user data?"
        onConfirm={() => successDelete()}
        onCancel={() => hideAlert()}
        confirmBtnCssClass={classes.button + " " + classes.success}
        cancelBtnCssClass={classes.button + " " + classes.danger}
        confirmBtnText="Yes, delete it!"
        cancelBtnText="Cancel"
        showCancel
      >
        You will not be able to recover this user data!
      </SweetAlert>
    );
  };
  const hideAlert = () => {
    setAlert(null);
  };
  const successDelete = async () => {
    try {
      const { data } = await authAxios
        .delete(`/remove-user/${id}`)
        .catch((err) => {
          catchFunc(err);
        });
      props.history.push("/admin/users");
    } catch (err) {
      catchFunc(err);
    }
  };
  const postBalance = async () => {
    try {
      const { data } = await authAxios.put(`/balance/${id}`, { pivx:balance }
      ).catch((err) => {
        catchFunc(err);
      });
      setBalanceEditable(false);
    } catch (err) {
      catchFunc(err);
    }
  };

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
    console.log(props);
    (async () => {
      try {
        const { data } = await authAxios.get(`/user/${id}`).catch((err) => {
          catchFunc(err);
        });
        setUser(data.user);
        setBalance(data.user.pivx);
        setRecharges(data.recharges);
        setWithdrawals(data.withdrawals);
      } catch (err) {
        catchFunc(err);
      }
    })();
  }, []);
  console.log(user);
  return (
    <GridContainer>
      <GridItem xs={12}>
        {alert}
        <Card>
          <CardHeader color="primary" icon>
            <CardIcon color="primary">
              <AccountCircle />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>User</h4>
          </CardHeader>
          <CardBody>
            <GridContainer>
              <GridItem xs={12}>
                {authState.userInfo.admin && !user.admin ? (
                  <Button justIcon round color="primary" onClick={pointUp}>
                    <ThumbUpAlt />
                  </Button>
                ) : (
                  ""
                )}
                {authState.userInfo.admin && user.admin ? (
                  <Button justIcon round color="info" onClick={pointDown}>
                    <ThumbDown />
                  </Button>
                ) : (
                  ""
                )}
                {authState.userInfo.admin ? (
                  <Button justIcon round color="danger" onClick={remove}>
                    <DeleteForever />
                  </Button>
                ) : (
                  ""
                )}
              </GridItem>
            </GridContainer>
            <GridContainer>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Role</h4>
                <div>
                  {user.admin ? (
                    <Warning>Admin</Warning>
                  ) : (
                    "User"
                  )}
                </div>
              </GridItem>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Username</h4>
                <p>{user.username}</p>
              </GridItem>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Email</h4>
                <p>{user.email}</p>
              </GridItem>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Joined at</h4>
                <p>{user.created}</p>
              </GridItem>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Balance</h4>
                {balanceEditable ? (
                  <div>
                    <CustomInput
                      labelText="Balance"
                      id="balance"
                      formControlProps={{
                        fullWidth: true
                      }}
                      inputProps={{
                        type: "number",
                        value: balance,
                        onChange: (e) => { setBalance(e.target.value) }
                      }}
                    />
                    <Button onClick={postBalance} size="sm" simple color="primary">OK</Button>
                    <Button color="warning" simple onClick={() => { setBalanceEditable(false); setBalance(user.budget) }}>Cancel</Button>
                  </div>
                ) : (
                    <div>{balance} satoshies<Button onClick={() => setBalanceEditable(true)} size="sm" simple justIcon color="primary"><Edit /></Button></div>
                  )}
              </GridItem>
              <GridItem xs={12} lg={3} md={4} sm={6}>
                <h4>Referrer 1</h4>
                <p>{user.refer1? user.refer1.username  : ''}</p>
              </GridItem>
              
            </GridContainer>
            <hr />
            <GridContainer>
              <GridItem md={12} lg={6}>
                <h4>Recharge List</h4>
                <ReactTable
                  nextBtn={false}
                  columns={[
                    {
                      Header: "Transaction ID",
                      accessor: "txid",
                    },
                    {
                      Header: "Amount",
                      accessor: "amount",
                    },
                    {
                      Header: "Date",
                      accessor: "createdAt",
                    },
                  ]}
                  data={
                    recharges && recharges.length > 0
                      ? recharges.map((ele, key) => {
                          return {
                            txid: ele.txid,
                            amount: ele.amount,
                            createdAt: ele.createdAt,
                          };
                        })
                      : []
                  }
                />
                <br />
              </GridItem>
              <GridItem md={12} lg={6}>
                <h4>Withdrawal List</h4>
                <ReactTable
                  nextBtn={false}
                  columns={[
                    {
                      Header: "Amount",
                      accessor: "amount",
                    },
                    {
                      Header: "To",
                      accessor: "address",
                    },
                    {
                      Header: "Transaction ID",
                      accessor: "txid",
                    },
                    {
                      Header: "Date",
                      accessor: "createdAt",
                    }
                  ]}
                  data={
                    withdrawals && withdrawals.length > 0
                      ? withdrawals.map((ele) => {
                          return {
                            _id: ele._id,
                            amount: ele.amount,
                            createdAt: ele.createdAt,
                            txid:ele.txid,
                            address:ele.address
                          };
                        })
                      : []
                  }
                />
              </GridItem>
            </GridContainer>
            <hr />
            <GridContainer>
              <GridItem xs={12}>
                <h4>Financial History</h4>
                <ReactTable
                  nextBtn={false}
                  columns={[
                    {
                      Header: "Type",
                      accessor: "type",
                    },
                    {
                      Header: "Amount",
                      accessor: "amount",
                    },
                    {
                      Header: "Details",
                      accessor: "details",
                    },
                    {
                      Header: "Date",
                      accessor: "createdAt",
                    },
                  ]}
                  data={
                    user.financials && user.financials.length > 0
                      ? user.financials.map((ele) => {
                          return {
                            type: ele.type,
                            amount: ele.amount,
                            details: ele.details,
                            createdAt: ele.createdAt,
                          };
                        })
                      : []
                  }
                />
              </GridItem>
            </GridContainer>
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer>
  );
}
