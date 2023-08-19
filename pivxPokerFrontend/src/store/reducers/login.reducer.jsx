const INITIAL_STATE = {
  loginUserId: "",
  loginToken: "",
  loginUserPivx: 0,
  loginUserName: "",
  loginUserEmail: "",
  loginUserRole: "",
  loginUserWalletAddress: "",
  loginUserDepositAddress: "",
  loginUserAvatar: "",
  loginUserLevel: "",
};

const LoginReducer = (state = INITIAL_STATE, action) => {
  let loginUserId;
  let loginToken;
  let loginUserName;
  let loginUserRole;
  let loginUserPivx;
  let loginUserWalletAddress;
  let loginUserDepositAddress;
  let loginUserAvatar;
  let loginUserLevel;
  let loginUserEmail;
  let data;

  switch (action.type) {
    case "LOGIN_SUCCESS":
      data = action.loginData;
      loginUserId = data.userInfo.id;
      loginToken = data.token;
      loginUserName = data.userInfo.username;
      loginUserLevel = data.userInfo.level;
      loginUserPivx = data.userInfo.pivx;
      loginUserRole = data.userInfo.role;
      loginUserDepositAddress = data.userInfo.address;
      loginUserWalletAddress = data.userInfo.my_address;
      loginUserAvatar = data.userInfo.profilePhoto;
      return {
        ...state,
        loginUserId,
        loginToken,
        loginUserName,
        loginUserPivx,
        loginUserRole,
        loginUserDepositAddress,
        loginUserWalletAddress,
        loginUserAvatar,
        loginUserLevel,
      };
    case "PIVX_CHANGE":
      return {
        ...state,
        loginUserPivx: action.loginUserPivx,
      };

    case "DEPOSIT_ADDRESS_CHNAGE":
      return {
        ...state,
        loginUserDepositAddress: action.loginUserDepositAddress,
      };

    case "WALLET_ADDRESS_CHNAGE":
      return {
        ...state,
        loginUserWalletAddress: action.loginUserWalletAddress,
      };
    case "PHOTO_CHANGE":
      return {
        ...state,
        loginUserAvatar: action.loginUserAvatar,
      };
    case "SET_EMAIL":
      return {
        ...state,
        loginUserEmail: action.loginUserEmail,
      };
    case "LOGOUT_SUCCESS":
      return {
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
export default LoginReducer;
