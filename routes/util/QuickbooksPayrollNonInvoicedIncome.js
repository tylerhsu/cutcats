const moment = require('moment');
const _ = require('lodash');
const QuickbooksExport = require('./QuickbooksExport');

const NUM = 'Num';
const NAME = 'Name';
const DATE = 'Date';
const MEMO = 'Memo';
const ACCOUNT = 'Account';
const AMOUNT = 'Amount';
const CLASS = 'Class';

class QuickbooksPayrollNonInvoicedIncome extends QuickbooksExport {
  constructor(courierPaystubs, periodStart, periodEnd) {
    super(periodStart, periodEnd);
    this.courierPaystubs = courierPaystubs;
  }

  getOrderedFields() {
    return [
      NUM,
      NAME,
      DATE,
      MEMO,
      ACCOUNT,
      AMOUNT,
      CLASS
    ];
  }

  getRow(courierPaystub) {
    return this.orderFields({
      [NUM]: 1,
      [NAME]: courierPaystub.getCourierName(),
      [DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [MEMO]: 'Cash Rides Payout',
      [ACCOUNT]: this.getAccount(courierPaystub),
      [AMOUNT]: courierPaystub.getFeesCollectedByRider(),
      [CLASS]: 'CutCats'
    });
  }

  getAccount(courierPaystub) {
    switch(courierPaystub.courier.status) {
    case 'member': return 'Guaranteed Pay to Partners:Delivery Fee Payout';
    case 'guest': return 'Non-Partner Rider Payouts:Delivery Fee Payout';
    default: throw new Error(`Don't know what to put in the "Account" field for a courier whose account mapping is "${courierPaystub.courier.status}"`);
    }
  }

  getCsvRows() {
    const topRow = this.orderFields({
      [NUM]: 1,
      [NAME]: '',
      [DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [MEMO]: 'Cash Rides',
      [ACCOUNT]: 'Sales Income:Delivery Fee Income',
      [AMOUNT]: _.sumBy(this.courierPaystubs, courierPaystub => courierPaystub.getFeesCollectedByRider()) * -1,
      [CLASS]: 'CutCats'
    });
    return [
      topRow,
      ...this.courierPaystubs.map(courierPaystub => {
        return this.getRow(courierPaystub);
      })
    ];
  }
}

module.exports = QuickbooksPayrollNonInvoicedIncome;
