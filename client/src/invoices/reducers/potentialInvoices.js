import _ from 'lodash';
import moment from 'moment';

import {
  FETCH_INVOICES_BEGIN,
  FETCH_INVOICES_SUCCESS,
  FETCH_INVOICES_ERROR
} from './invoices';

export default function potentialInvoices(state = {
  payload: []
}, action) {
  switch(action.type) {
  case FETCH_INVOICES_BEGIN:
    return {
      payload: []
    };
  case FETCH_INVOICES_SUCCESS:
    return {
      payload: getPotentialInvoices(action.payload, action.fromDate, action.toDate),
    };
  case FETCH_INVOICES_ERROR:
    return {
      payload: []
    };
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
