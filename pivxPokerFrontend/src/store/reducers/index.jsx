import { combineReducers } from 'redux';
import LobbyReducer from './lobby.reducer';
import LoginReducer from './login.reducer';
import TableReducer from './table.reducer';

export const reducer = combineReducers({
  LoginReducer,
  LobbyReducer,
  TableReducer,
  });
  