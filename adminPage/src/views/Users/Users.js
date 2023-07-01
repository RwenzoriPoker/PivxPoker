import React, { useEffect } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// @material-ui/icons
import People from "@material-ui/icons/People";
import Dvr from "@material-ui/icons/Dvr";
// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardIcon from "components/Card/CardIcon.js";
import CardHeader from "components/Card/CardHeader.js";
import ReactTable from "components/ReactTable/ReactTable.js";
import { FetchContext } from "variables/authFetch";
import { useSnackbar } from "notistack";

import { cardTitle } from "assets/jss/material-dashboard-pro-react.js";
import CircularProgress from "@material-ui/core/CircularProgress";

import modalStyle from "assets/jss/material-dashboard-pro-react/modalStyle.js";

const styles = (theme) => ({
  cardIconTitle: {
    ...cardTitle,
    marginTop: "15px",
    marginBottom: "0px",
  },
  modalSectionTitle: {
    marginTop: "30px",
  },
  ...modalStyle(theme),
});

const useStyles = makeStyles(styles);

export default function Users() {
  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = React.useState([]);
  const [reload, setReload] = React.useState(false);
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
        const { data } = await authAxios.get("/users").catch((err) => {
          catchFunc(err);
        });
        setUsers(
          data.map((prop, key) => {
            return {
              id: key,
              username: prop.username,
              role: prop.admin                
                ? "Admin"
                : "User",
              amount: prop.pivx,
              actions: (
                // we've added some custom button actions
                <div className="actions-right">
                  <Button
                    justIcon
                    round
                    simple
                    onClick={() => {
                      window.open(
                        "/admin/user/" + prop.id,
                        "_blank" // <- This is what makes it open in a new window.
                      );
                    }}
                    color="warning"
                    className="edit"
                  >
                    <Dvr />
                  </Button>{" "}
                </div>
              ),
            };
          })
        );
      } catch (err) {
        console.log(err);
        catchFunc(err);
      }
    })();
  }, [reload]);
  const classes = useStyles();
  return (
    <GridContainer>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="primary" icon>
            <CardIcon color="primary">
              <People />
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Users</h4>
          </CardHeader>
          <CardBody>
            {users.length ? (
              <ReactTable
                columns={[
                  {
                    Header: "Username",
                    accessor: "username",
                  },
                  {
                    Header: "Role",
                    accessor: "role",
                  },
                  {
                    Header: "PIVX",
                    accessor: "amount",
                  },
                  {
                    Header: "Actions",
                    accessor: "actions",
                  },
                ]}
                data={users}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <CircularProgress />
              </div>
            )}
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer>
  );
}