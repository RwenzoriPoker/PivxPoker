import * as types from '../actions/types'

const initialState = {
  players: [
    {},
    {},
    {
        me:true,
        dealer:true,
        avatar:"https://media.gettyimages.com/photos/celebrity-guests-for-hoang-hai-of-vietnam-attend-season-3-of-tiffanys-picture-id959221348?k=6&m=959221348&s=612x612&w=0&h=KWYwAacvcUHGe34hNOGpoZMWvGI0uG8gpEoNBCEkgwo=",
        username : "user 1",
        userId : "123",
        balance:1000,
        bets:100, 
        current:10,
        status:"BET"
    },
    {
        me:false,
        dealer:false,
        avatar:"https://media.gettyimages.com/photos/celebrity-guests-for-hoang-hai-of-vietnam-attend-season-3-of-tiffanys-picture-id959221348?k=6&m=959221348&s=612x612&w=0&h=KWYwAacvcUHGe34hNOGpoZMWvGI0uG8gpEoNBCEkgwo=",
        username : "user 2",
        userId : "124",
        balance:1000,
        bets:100, 
        current:10,
        status:"BET"
    },
    {
        me:false,
        dealer:false,
        avatar:"https://media.gettyimages.com/photos/celebrity-guests-for-hoang-hai-of-vietnam-attend-season-3-of-tiffanys-picture-id959221348?k=6&m=959221348&s=612x612&w=0&h=KWYwAacvcUHGe34hNOGpoZMWvGI0uG8gpEoNBCEkgwo=",
        username : "user 2",
        userId : "125",
        balance:100,
        bets:100, 
        current:0,
        status:"ALLIN"
    },
    {
        me:false,
        dealer:false,
        avatar:"https://media.gettyimages.com/photos/celebrity-guests-for-hoang-hai-of-vietnam-attend-season-3-of-tiffanys-picture-id959221348?k=6&m=959221348&s=612x612&w=0&h=KWYwAacvcUHGe34hNOGpoZMWvGI0uG8gpEoNBCEkgwo=",
        username : "user 3",
        userId : "126",
        balance:100,
        bets:100, 
        current:0,
        status:"FOLD"
    }
],

}
const TableReducer = (state = initialState, action) => {
  switch (action.type) {

    case types.MOBILE_SCREEN_ACTION: {
      return { ...state, mobileView: action.mobileView }
    }
    case types.TAB_CHANGE: {
      return { ...state, currentTab: action.tabName }
    }
    case types.CATCH_ERROR: {
      return { ...state }
    }
    default: {
      return state
    }
  }
}

export default TableReducer
