import { combineReducers } from 'redux';
import user from '../../global/reducers/user';
import payrolls from './payrolls';

export default combineReducers({
  user,
  payrolls
});
