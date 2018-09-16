import axios from 'axios';
import moment from 'moment';
import qs from 'querystring';
import _ from 'lodash';

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
  if (fromDate) {
    fromDate = moment(fromDate).startOf('day').valueOf();
  }
  if (toDate) {
    toDate = moment(toDate).endOf('day').valueOf();
  }
  return dispatch => {
    dispatch(fetchInvoicesBegin(fromDate, toDate));
    return axios.get('/api/invoices', {
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
        throw err;
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
    return axios.post(`/api/invoices/generate?periodStart=${fromDate}&periodEnd=${toDate}`)
      .then(res => {
        dispatch(runInvoicingSuccess(res.data, fromDate, toDate));
      })
      .catch(err => {
        dispatch(runInvoicingError(err, fromDate, toDate));
        throw err;
      });
  };
}

const query = qs.parse(window.location.search.replace('?', ''));
const urlFromDate = query.startDate ? parseInt(query.startDate) : null;
const urlToDate = query.endDate ? parseInt(query.endDate) : null;

export default function invoices(state = {
  loading: null,
  payload: [],
  potentialInvoices: [],
  fromDate: urlFromDate || moment().subtract(2, 'months').valueOf(),
  toDate: urlToDate || moment().valueOf(),
  error: false
}, action) {
  switch(action.type) {
  case FETCH_INVOICES_BEGIN:
    return {
      loading: true,
      payload: [],
      potentialInvoices: [],
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_INVOICES_SUCCESS:
    return {
      loading: false,
      payload: action.payload,
      potentialInvoices: getPotentialInvoices(action.payload, action.fromDate, action.toDate),
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_INVOICES_ERROR:
    return {
      loading: false,
      payload: action.payload,
      potentialInvoices: [],
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: true
    };
  case RUN_INVOICING_SUCCESS: {
    const invoices = state.payload.concat([action.payload]);
    return {
      ...state,
      payload: invoices,
      potentialInvoices: getPotentialInvoices(invoices, state.fromDate, state.toDate)
    };
  }
  default: return state;
  }
}

function getPotentialInvoices(invoices, fromDate, toDate) {
  return _.chain(getGaps(invoices, nearestPeriodStartRoundedDown(fromDate), nearestPeriodEndRoundedUp(toDate)))
    .map(gap => {
      return partitionIntoPeriods(gap[0], gap[1]);
    })
    .flatten()
    .map(period => ({
      periodStart: period[0],
      periodEnd: period[1]
    }))
    .value();
}

function getGaps(invoices, startDate, endDate) {
  let gaps = [];
  const sortedInvoices = invoices.sort((a, b) => (new Date(a.periodStart) - new Date(b.periodStart)));
  for (let n = 0; n <= sortedInvoices.length; n++) {
    let gapStart = n === 0 ?
      new Date(startDate) :
      moment(sortedInvoices[n - 1].periodEnd).add(1, 'day').startOf('day').toDate();
    let gapEnd = n === sortedInvoices.length ?
      new Date(endDate) :
      moment(sortedInvoices[n].periodStart).subtract(1, 'day').endOf('day').toDate();
    if (gapEnd - gapStart > 1) {
      gaps.push([gapStart, gapEnd]);
    }
  }
  return gaps;
}

function partitionIntoPeriods(startDate, endDate) {
  let periods = [];
  let periodStart = new Date(startDate);
  let periodEnd = nearestPeriodEndRoundedUp(periodStart);
  while (periodEnd < endDate) {
    periods.push([periodStart, periodEnd]);
    periodStart = moment(periodEnd).add(1, 'day').startOf('day').toDate();
    periodEnd = nearestPeriodEndRoundedUp(periodStart);
  }
  if (periodStart < endDate) {
    periods.push([periodStart, endDate]);
  }
  return periods;
}

function nearestPeriodStartRoundedDown(date) {
  const calendarDate = moment(date).date();
  return moment(date).date(calendarDate < 16 ? 1 : 16).startOf('day').toDate();
}

function nearestPeriodEndRoundedUp(date) {
  const calendarDate = moment(date).date();
  if (calendarDate < 16) {
    return moment(date).date(15).endOf('day').toDate();
  } else {
    return moment(date).endOf('month').toDate();
  }
}
