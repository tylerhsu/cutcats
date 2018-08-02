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
  const latestPeriodEnd = _.maxBy(invoices, invoice => invoice.periodEnd).periodEnd;
  let periodStart = moment(latestPeriodEnd).add(1, 'ms');
  let periodEnd = moment(periodStart).add(15, 'days');
  while (periodStart.valueOf() <= toDate) {
    potentialInvoices.unshift({
      periodStart: periodStart.toDate(),
      periodEnd: periodEnd.toDate()
    });
    periodStart = moment(periodEnd).add(1, 'ms');
    periodEnd = moment(periodStart).add(15, 'days');
  }
  return potentialInvoices;
}
