import React, { useEffect, useState } from "react";
import axios from "axios";
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
import TextField from '@material-ui/core/TextField';
import {staticURL} from "variables/publicFetch";
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

export default function Rakes(props) {
  const { authState } = React.useContext(AuthContext);
  const { authAxios } = React.useContext(FetchContext);
  const { enqueueSnackbar } = useSnackbar();
  const [cashRakes, setCashRakes] = useState();
	const [isCashRakePicked, setIsCashRakePicked] = useState(false);
  const [sitRakes, setSitRakes] = useState();
	const [isSitRakePicked, setIsSitRakePicked] = useState(false);
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
    (async ()=>{
      try {
        let respond = await axios({
          method:'get',
          url:`${staticURL}/uploads/configs/sitRakes.json`
        });
        setSitRakes(JSON.stringify(respond.data));
        respond = await axios({
          method:'get',
          url:`${staticURL}/uploads/configs/cashRakes.json`
        });
        setCashRakes(JSON.stringify(respond.data));
      } catch (err) {
        catchFunc(err);
      }
    })();
    return () => {      
    }
  }, [])
	const upload =async () => {   

    try {
      const { data } = await authAxios.post(`/upload-rakes`,{cashRakes, sitRakes}).catch(err => {
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
            <h4 className={classes.cardIconTitle}>Rakes</h4>
          </CardHeader>
          <CardBody>
            <GridContainer>
              <GridItem xs={12}>
              <h6>CashGame Rakes</h6>
              </GridItem>
              <GridItem xs={12}>
              <TextField
                id="cashRake"
                label=""
                multiline
                fullWidth
                value={cashRakes}
                onChange={(e)=>setCashRakes(e.target.value)}
              />
              </GridItem>
            </GridContainer>
            <GridContainer>
              <GridItem xs={12}>
              <h6>Sit&Go Rakes</h6>
              </GridItem>
              <GridItem xs={12}>
              <TextField
                id="sitRakes"
                label=""
                multiline
                fullWidth
                value={cashRakes}
                onChange={(e)=>setSitRakes(e.target.value)}
              />
              </GridItem>
            </GridContainer>
            <hr />
            <Button color="rose" onClick={upload}>Upload Modification</Button>
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer >
  );
}