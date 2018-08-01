import { combineReducers } from 'redux';
import user from '../../global/reducers/user';
import invoices from './invoices';
import dateFilter from './dateFilter';

export default combineReducers({
  user,
  invoices,
  dateFilter
});
