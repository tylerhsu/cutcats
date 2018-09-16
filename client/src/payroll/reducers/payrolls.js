import axios from 'axios';
import moment from 'moment';
import qs from 'querystring';
import _ from 'lodash';

export const FETCH_PAYROLLS_BEGIN = 'FETCH_PAYROLLS_BEGIN';
export const FETCH_PAYROLLS_SUCCESS = 'FETCH_PAYROLLS_SUCCESS';
export const FETCH_PAYROLLS_ERROR = 'FETCH_PAYROLLS_ERROR';
export const fetchPayrollsBegin = (fromDate, toDate) => ({
  type: FETCH_PAYROLLS_BEGIN,
  fromDate,
  toDate
});
export const fetchPayrollsSuccess = (payrolls, fromDate, toDate) => ({
  type: FETCH_PAYROLLS_SUCCESS,
  payload: payrolls,
  fromDate,
  toDate
});
export const fetchPayrollsError = (err, fromDate, toDate) => ({
  type: FETCH_PAYROLLS_ERROR,
  payload: err,
  error: true,
  fromDate,
  toDate
});
export function fetchPayrolls(fromDate, toDate) {
  if (fromDate) {
    fromDate = moment(fromDate).startOf('day').valueOf();
  }
  if (toDate) {
    toDate = moment(toDate).endOf('day').valueOf();
  }
  return dispatch => {
    dispatch(fetchPayrollsBegin(fromDate, toDate));
    return axios.get('/api/payrolls', {
      params: {
        from: fromDate,
        to: toDate,
        sort: '-periodStart'
      }
    })
      .then(res => {
        dispatch(fetchPayrollsSuccess(res.data, fromDate, toDate));
      })
      .catch(err => {
        dispatch(fetchPayrollsError(err, fromDate, toDate));
        throw err;
      });
  };
}

export const RUN_PAYROLL_BEGIN = 'RUN_PAYROLL_BEGIN';
export const RUN_PAYROLL_SUCCESS = 'RUN_PAYROLL_SUCCESS';
export const RUN_PAYROLL_ERROR = 'RUN_PAYROLL_ERROR';
export const runPayrollBegin = (fromDate, toDate) => ({
  type: RUN_PAYROLL_BEGIN,
  fromDate,
  toDate
});
export const runPayrollSuccess = (payroll, fromDate, toDate) => ({
  type: RUN_PAYROLL_SUCCESS,
  payload: payroll,
  fromDate,
  toDate
});
export const runPayrollError = (err, fromDate, toDate) => ({
  type: RUN_PAYROLL_ERROR,
  payload: err,
  error: true,
  fromDate,
  toDate
});
export function runPayroll(fromDate, toDate) {
  fromDate = new Date(fromDate).valueOf();
  toDate = new Date(toDate).valueOf();
  return dispatch => {
    dispatch(runPayrollBegin(fromDate, toDate));
    return axios.post(`/api/payrolls/generate?periodStart=${fromDate}&periodEnd=${toDate}`)
      .then(res => {
        dispatch(runPayrollSuccess(res.data, fromDate, toDate));
      })
      .catch(err => {
        dispatch(runPayrollError(err, fromDate, toDate));
        throw err;
      });
  };
}

const query = qs.parse(window.location.search.replace('?', ''));
const urlFromDate = query.startDate ? parseInt(query.startDate) : null;
const urlToDate = query.endDate ? parseInt(query.endDate) : null;

export default function payrolls(state = {
  loading: null,
  payload: [],
  potentialPayrolls: [],
  fromDate: urlFromDate || moment().subtract(2, 'months').valueOf(),
  toDate: urlToDate || moment().valueOf(),
  error: false
}, action) {
  switch(action.type) {
  case FETCH_PAYROLLS_BEGIN:
    return {
      loading: true,
      payload: [],
      potentialPayrolls: [],
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_PAYROLLS_SUCCESS:
    return {
      loading: false,
      payload: action.payload,
      potentialPayrolls: getPotentialPayrolls(action.payload, action.fromDate, action.toDate),
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: false
    };
  case FETCH_PAYROLLS_ERROR:
    return {
      loading: false,
      payload: action.payload,
      potentialPayrolls: [],
      fromDate: action.fromDate,
      toDate: action.toDate,
      error: true
    };
  case RUN_PAYROLL_SUCCESS: {
    const payrolls = state.payload.concat([action.payload]);
    return {
      ...state,
      payload: payrolls,
      potentialPayrolls: getPotentialPayrolls(payrolls, state.fromDate, state.toDate)
    };
  }
  default: return state;
  }
}

function getPotentialPayrolls(payrolls, fromDate, toDate) {
  return _.chain(getGaps(payrolls, nearestPeriodStartRoundedDown(fromDate), nearestPeriodEndRoundedUp(toDate)))
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

function getGaps(payrolls, startDate, endDate) {
  let gaps = [];
  const sortedPayrolls = payrolls.sort((a, b) => (new Date(a.periodStart) - new Date(b.periodStart)));
  for (let n = 0; n <= sortedPayrolls.length; n++) {
    let gapStart = n === 0 ?
      new Date(startDate) :
      moment(sortedPayrolls[n - 1].periodEnd).add(1, 'day').startOf('day').toDate();
    let gapEnd = n === sortedPayrolls.length ?
      new Date(endDate) :
      moment(sortedPayrolls[n].periodStart).subtract(1, 'day').endOf('day').toDate();
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
