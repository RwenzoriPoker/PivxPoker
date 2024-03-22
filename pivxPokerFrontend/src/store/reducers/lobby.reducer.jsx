import * as types from '../actions/types'

const initialState = {
  user: {},
  pageError: null,
  currentTab:'Cash Games',
  tabList:['Cash Games', 'Sit-n-Go', 'Tournaments'],
  mobileView:false,
}
const LobbyReducer = (state = initialState, action) => {
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

export default LobbyReducer
