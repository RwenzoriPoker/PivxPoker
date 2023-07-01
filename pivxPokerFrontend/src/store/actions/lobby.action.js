
import * as types from "./types";
export const HandleTabChange = (tabName) => ({
    type: types.TAB_CHANGE,
    tabName
})

export const ResolutionChange = (mobileView) => ({
    type: types.MOBILE_SCREEN_ACTION,
    mobileView,
  });