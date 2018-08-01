import axios from 'axios';

export const FETCH_INVOICES_BEGIN = 'FETCH_INVOICES_BEGIN';
export const FETCH_INVOICES_SUCCESS = 'FETCH_INVOICES_SUCCESS';
export const FETCH_INVOICES_ERROR = 'FETCH_INVOICES_ERROR';
export const fetchInvoicesBegin = () => ({
  type: FETCH_INVOICES_BEGIN
});
export const fetchInvoicesSuccess = (invoices) => ({
  type: FETCH_INVOICES_SUCCESS,
  payload: invoices
});
export const fetchInvoicesError = (err) => ({
  type: FETCH_INVOICES_BEGIN,
  payload: err,
  error: true
});
export function fetchInvoices(queryParams) {
  return dispatch => {
    dispatch(fetchInvoicesBegin());
    axios.get('/api/invoices', { params: queryParams })
      .then(res => {
        dispatch(fetchInvoicesSuccess(res.data));
      })
      .catch(err => {
        dispatch(fetchInvoicesError(err));
      });
  };
}

export default function invoices(state = {
  loading: null,
  payload: [],
  error: false
}, action) {
  switch(action.type) {
  case FETCH_INVOICES_BEGIN:
    return {
      loading: true,
      payload: [],
      error: false
    };
  case FETCH_INVOICES_SUCCESS:
    return {
      loading: false,
      payload: action.payload,
      error: false
    };
  case FETCH_INVOICES_ERROR:
    return {
      loading: false,
      payload: action.payload,
      error: true
    };
  default: return state;
  }
}
