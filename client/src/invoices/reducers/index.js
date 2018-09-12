import { combineReducers } from 'redux';
import user from '../../global/reducers/user';
import invoices from './invoices';

export default combineReducers({
  user,
  invoices
});
