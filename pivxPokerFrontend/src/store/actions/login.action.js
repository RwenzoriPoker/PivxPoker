import * as types from "./types";

export const LoginSuccess = (loginData) => ({
  type: types.LOGIN_SUCCESS,
  loginData,
});

export const LogOutSuccess = () => ({
  type: types.LOGOUT_SUCCESS,
});

export const PIVXChange = (loginUserPivx) => ({
  type: types.PIVX_CHANGE,
  loginUserPivx
});

export const SetEmail = (loginUserEmail) => ({
  type: types.SET_EMAIL,
  loginUserEmail
});

export const WalletAddressChange = (loginUserWalletAddress) => ({
  type: types.WALLET_ADDRESS_CHNAGE,
  loginUserWalletAddress
});

export const DepositAddressChange = (loginUserDepositAddress) => ({
  type: types.DEPOSIT_ADDRESS_CHNAGE,
  loginUserDepositAddress
});

export const PhotoChange = (loginUserAvatar) => ({
  type: types.PHOTO_CHANGE,
  loginUserAvatar
});
