const moment = require('moment');
const QuickbooksExport = require('./QuickbooksExport');

const REF_NUMBER = 'RefNumber';
const CUTCAT_NAME = 'CutCat Name';
const DATE = 'Date';
const EXPENSE_ACCOUNT = 'Expense Account';
const EXPENSE_AMOUNT = 'Expense Amount';
const EXPENSE_MEMO = 'Expense Memo';
const EXPENSE_CLASS = 'Expense Class';
const AP_ACCOUNT = 'AP Account';

class QuickbooksPayrollDebits extends QuickbooksExport {
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
      EXPENSE_MEMO,
      EXPENSE_CLASS,
      AP_ACCOUNT
    ];
  }

  getCsvRows() {
    return this.courierPaystubs.map(courierPaystub => {
      return {
        [CUTCAT_NAME]: courierPaystub.getCourierName(),
        [DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
        [EXPENSE_CLASS]: 'CutCats',
        [AP_ACCOUNT]: 'Accounts Payable',
        [EXPENSE_ACCOUNT]: 'Radio Service Fees:Rider Monthly Service Fees',
        [EXPENSE_AMOUNT]: courierPaystub.getRadioFee(),
        [EXPENSE_MEMO]: 'Radio Unit',
      };
    })
      .filter(row => {
        return row[EXPENSE_AMOUNT] !== 0;
      })
      .map((row, n) => {
        return this.orderFields({
          ...row,
          [REF_NUMBER]: n,
        });
      });
  }
}

module.exports = QuickbooksPayrollDebits;
