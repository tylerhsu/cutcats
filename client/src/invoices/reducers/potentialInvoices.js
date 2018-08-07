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
      payload: getPotentialInvoices(action.payload, action.toDate),
    };
  case FETCH_INVOICES_ERROR:
    return {
      payload: []
    };
  default: return state;
  }
}

function getPotentialInvoices(invoices, toDate) {
  let potentialInvoices = [];
  let periodEnd = _.maxBy(invoices, invoice => invoice.periodEnd).periodEnd;
  let periodStart;
  do {
    periodStart = moment(periodEnd).add(1, 'day').startOf('day');
    periodEnd = nearestHalfMonth(moment(periodStart).add(15, 'days'));
    if (periodStart.valueOf() <= toDate) {
      potentialInvoices.unshift({
        periodStart: periodStart.toDate(),
        periodEnd: periodEnd.toDate()
      });
    }
  } while (periodStart.valueOf() <= toDate);
  return potentialInvoices;
}

function nearestHalfMonth(momentDate) {
  const calendarDate = momentDate.date();
  if (calendarDate < 8) {
    return moment(momentDate).date(1).endOf('day');
  } else if (calendarDate > 22) {
    return moment(momentDate).endOf('month').endOf('day');
  } else {
    return moment(momentDate).date(15).endOf('day');
  }
}
