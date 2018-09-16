const moment = require('moment');
const QuickbooksExport = require('./QuickbooksExport');

const REF_NUMBER = 'RefNumber';
const CUTCAT_NAME = 'CutCat Name';
const DATE = 'Date';
const EXPENSE_ACCOUNT = 'Expense Account';
const EXPENSE_AMOUNT = 'Expense Amount';
const EXPENSE_DESCRIPTION = 'Expense Description';
const EXPENSE_CLASS = 'Expense Class';
const AP_ACCOUNT = 'AP Account';

class QuickbooksPayrollCredits extends QuickbooksExport {
  constructor(courierPaystubs, periodStart, periodEnd) {
    super(periodStart, periodEnd);
    this.courierPaystubs = courierPaystubs;
  }

  getOrderedFields() {
    return [
      REF_NUMBER,
      CUTCAT_NAME,
      DATE,
      EXPENSE_ACCOUNT,
      EXPENSE_AMOUNT,
      EXPENSE_DESCRIPTION,
      EXPENSE_CLASS,
      AP_ACCOUNT
    ];
  }

  getRow(courierPaystub, refNumber) {
    if (isNaN(parseInt(refNumber))) {
      throw new Error('refNumber is required');
    }
    
    return this.orderFields({
      [REF_NUMBER]: refNumber,
      [CUTCAT_NAME]: courierPaystub.getCourierName(),
      [DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [EXPENSE_ACCOUNT]: this.getExpenseAccount(courierPaystub),
      [EXPENSE_AMOUNT]: courierPaystub.getFeesOwedToRider(),
      [EXPENSE_DESCRIPTION]: `Invoiced Rides Payout pay period ${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
      [EXPENSE_CLASS]: 'CutCats',
      [AP_ACCOUNT]: 'Accounts Payable'
    });
  }

  getExpenseAccount(courierPaystub) {
    switch(courierPaystub.courier.status) {
    case 'member': return 'Guaranteed Pay to Partners:Delivery Fee Payout';
    case 'guest': return 'Non-Partner Rider Payouts:Delivery Fee Payout';
    default: throw new Error(`Don't know what to put in the "Expense Account" field for a courier whose account mapping is "${courierPaystub.courier.status}"`);
    }
  }

  getCsvRows() {
    return this.courierPaystubs
      .map((courierPaystub, n) => {
        return this.getRow(courierPaystub, n);
      })
      .filter(row => {
        return row[EXPENSE_AMOUNT] !== 0;
      });
  }
}

module.exports = QuickbooksPayrollCredits;
