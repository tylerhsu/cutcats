import { combineReducers } from 'redux';
import user from '../../global/reducers/user';
import invoices from './invoices';
import potentialInvoices from './potentialInvoices';

export default combineReducers({
  user,
  invoices,
  potentialInvoices
});
