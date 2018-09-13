const csv = require('csv');
const moment = require('moment');

const CUSTOMER = 'Customer';
const TRANSACTION_DATE = 'Transaction Date';
const REF_NUMBER = 'RefNumber';
const CLASS = 'Class';
const DUE_DATE = 'Due Date';
const MEMO = 'Memo';
const ITEM = 'Item';
const QUANTITY = 'Quantity';
const DESCRIPTION = 'Description';
const PRICE = 'Price';
const TO_BE_EMAILED = 'To Be E-Mailed';

class QuickbooksPayroll {
  constructor(courierPaystubs, periodStart, periodEnd, monthStart, monthEnd) {
    this.courierPaystubs = courierPaystubs;
    this.periodStart = new Date(periodStart);
    this.periodEnd = new Date(periodEnd);
    this.monthStart = new Date(monthStart);
    this.monthEnd = new Date(monthEnd);
  }

  getOrderedFields() {
    return [
      CUSTOMER,
      TRANSACTION_DATE,
      REF_NUMBER,
      CLASS,
      DUE_DATE,
      MEMO,
      ITEM,
      QUANTITY,
      DESCRIPTION,
      PRICE,
      TO_BE_EMAILED
    ];
  }

  getCommonFields(courierPaystub, refNumber) {
    if (isNaN(parseInt(refNumber))) {
      throw new Error('refNumber is required');
    }
    
    return {
      [CUSTOMER]: courierPaystub.courier.name,
      [TRANSACTION_DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [REF_NUMBER]: refNumber,
      [CLASS]: 'CutCats',
      [DUE_DATE]: moment(this.periodEnd).add(20, 'days').format('MM/DD/YYYY'),
      [QUANTITY]: 1,
      [TO_BE_EMAILED]: 'Y'
    };
  }

  getDeliveryFeeRow(courierPaystub, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(courierPaystub, refNumber),
      [MEMO]: `Delivery Fees ${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
      [ITEM]: 'Delivery Fees:Delivery Fees',
      [DESCRIPTION]: `${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
      [PRICE]: courierPaystub.getDeliveryFeeTotal(),
    });
  }

  getAdminFeeRow(courierPaystub, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(courierPaystub, refNumber),
      [MEMO]: `Administrative Fees ${moment(this.monthStart).format('MM/DD/YYYY')}-${moment(this.monthEnd).format('MM/DD/YYYY')}`,
      [ITEM]: `Monthly Admin Fee:$${courierPaystub.getAdminFee()} Monthly Fee`,
      [DESCRIPTION]: `${moment(this.monthStart).format('MM/DD/YYYY')}-${moment(this.monthEnd).format('MM/DD/YYYY')}`,
      [PRICE]: courierPaystub.getAdminFee(),
    });
  }

  orderFields(row) {
    const numFieldsInRow = Object.keys(row).length;
    const numFieldsExpected = Object.keys(this.getOrderedFields()).length;
    if (numFieldsInRow !== numFieldsExpected) {
      throw new Error(`Expected ${numFieldsExpected} but got ${numFieldsInRow}`);
    }
    return this.getOrderedFields().reduce((memo, fieldName) => {
      memo[fieldName] = row[fieldName];
      return memo;
    }, {});
  }

  renderCsv() {
    const rows = [];
    this.courierPaystubs.forEach((courierPaystub, n) => {
      rows.push(this.getDeliveryFeeRow(courierPaystub, n));
      if (courierPaystub.isMonthEnd) {
        rows.push(this.getAdminFeeRow(courierPaystub, n));
      }
    });
    return new Promise((resolve, reject) => {
      csv.stringify(rows, { header: true }, (err, data) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    });
  }
}

module.exports = QuickbooksPayroll;
