import axios from 'axios';
import moment from 'moment';
import qs from 'querystring';

export const FETCH_INVOICES_BEGIN = 'FETCH_INVOICES_BEGIN';
export const FETCH_INVOICES_SUCCESS = 'FETCH_INVOICES_SUCCESS';
export const FETCH_INVOICES_ERROR = 'FETCH_INVOICES_ERROR';
export const fetchInvoicesBegin = (fromDate, toDate) => ({
  type: FETCH_INVOICES_BEGIN,
  fromDate,
  toDate
});
export const fetchInvoicesSuccess = (invoices, fromDate, toDate) => ({
  type: FETCH_INVOICES_SUCCESS,
  payload: invoices,
  fromDate,
  toDate
});
export const fetchInvoicesError = (err, fromDate, toDate) => ({
  type: FETCH_INVOICES_ERROR,
  payload: err,
  error: true,
  fromDate,
  toDate
});
export function fetchInvoices(fromDate, toDate) {
  fromDate = moment(fromDate).startOf('day').valueOf();
  toDate = moment(toDate).endOf('day').valueOf();
  return dispatch => {
    dispatch(fetchInvoicesBegin(fromDate, toDate));
    axios.get('/api/invoices', {
      params: {
        from: fromDate,
        to: toDate,
        sort: '-periodStart'
      }
    })
      .then(res => {
        dispatch(fetchInvoicesSuccess(res.data, fromDate, toDate));
      })
      .catch(err => {
        dispatch(fetchInvoicesError(err, fromDate, toDate));
      });
  };
}

export const RUN_INVOICING_BEGIN = 'RUN_INVOICING_BEGIN';
export const RUN_INVOICING_SUCCESS = 'RUN_INVOICING_SUCCESS';
export const RUN_INVOICING_ERROR = 'RUN_INVOICING_ERROR';
export const runInvoicingBegin = (fromDate, toDate) => ({
  type: RUN_INVOICING_BEGIN,
  fromDate,
  toDate
});
export const runInvoicingSuccess = (invoice, fromDate, toDate) => ({
  type: RUN_INVOICING_SUCCESS,
  payload: invoice,
  fromDate,
  toDate
});
export const runInvoicingError = (err, fromDate, toDate) => ({
  type: RUN_INVOICING_ERROR,
  payload: err,
  error: true,
  fromDate,
  toDate
});
export function runInvoicing(fromDate, toDate) {
  fromDate = new Date(fromDate).valueOf();
  toDate = new Date(toDate).valueOf();
  return dispatch => {
    dispatch(runInvoicingBegin(fromDate, toDate));
    axios.post(`/api/invoices/generate?periodStart=${fromDate}&periodEnd=${toDate}`)
      .then(res => {
        dispatch(runInvoicingSuccess(res.data, fromDate, toDate));
      })
      .catch(err => {
        dispatch(runInvoicingError(err, fromDate, toDate));
      });
  };
}

const query = qs.parse(window.location.search.replace('?', ''));
const urlFromDate = query.startDate ? parseInt(query.startDate) : null;
const urlToDate = query.endDate ? parseInt(query.endDate) : null;

export default function invoices(state = {
  loading: null,
  payload: [],
  fromDate: urlFromDate || moment().subtract(2, 'months').valueOf(),
  toDate: urlToDate || moment().valueOf(),
  error: false
}, action) {
  switch(action.type) {
  case FETCH_INVOICES_BEGIN:
    return {
      loading: true,
      payload: [],
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_INVOICES_SUCCESS:
    return {
      loading: false,
      payload: action.payload,
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_INVOICES_ERROR:
    return {
      loading: false,
      payload: action.payload,
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: true
    };
  default: return state;
  }
}
