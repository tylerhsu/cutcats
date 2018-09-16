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

  getCommonFields(courierPaystub, refNumber) {
    if (isNaN(parseInt(refNumber))) {
      throw new Error('refNumber is required');
    }
    
    return {
      [REF_NUMBER]: refNumber,
      [CUTCAT_NAME]: courierPaystub.getCourierName(),
      [DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [EXPENSE_CLASS]: 'CutCats',
      [AP_ACCOUNT]: 'Accounts Payable'
    };
  }

  getDeliveryFeeRow(courierPaystub, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(courierPaystub, refNumber),
      [EXPENSE_ACCOUNT]: 'Sales Income:Delivery Fee Income',
      [EXPENSE_AMOUNT]: courierPaystub.getToCCTotal(),
      [EXPENSE_MEMO]: `Slush owed pay period ${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
    });
  }

  getRadioFeeRow(courierPaystub, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(courierPaystub, refNumber),
      [EXPENSE_ACCOUNT]: 'Radio Service Fees:Rider Monthly Service Fees',
      [EXPENSE_AMOUNT]: courierPaystub.getRadioFee(),
      [EXPENSE_MEMO]: 'Radio Unit',
    });
  }

  getCsvRows() {
    const deliveryFeeRows = this.courierPaystubs.map((courierPaystub, n) => {
      return this.getDeliveryFeeRow(courierPaystub, n);
    });
    const radioFeeRows = this.courierPaystubs.map((courierPaystub, n) => {
      return this.getRadioFeeRow(courierPaystub, n + deliveryFeeRows.length);
    });
    return deliveryFeeRows.concat(radioFeeRows).filter(row => {
      return row[EXPENSE_AMOUNT] !== 0;
    });
  }
}

module.exports = QuickbooksPayrollDebits;
