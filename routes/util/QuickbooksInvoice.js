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

class QuickbooksInvoice {
  constructor(clientInvoices, periodStart, periodEnd, monthStart, monthEnd) {
    this.clientInvoices = clientInvoices;
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

  getCommonFields(clientInvoice, refNumber) {
    if (isNaN(parseInt(refNumber))) {
      throw new Error('refNumber is required');
    }
    
    return {
      [CUSTOMER]: clientInvoice.client.name,
      [TRANSACTION_DATE]: moment(this.periodEnd).format('MM/DD/YYYY'),
      [REF_NUMBER]: refNumber,
      [CLASS]: 'CutCats',
      [DUE_DATE]: moment(this.periodEnd).add(20, 'days').format('MM/DD/YYYY'),
      [QUANTITY]: 1,
      [TO_BE_EMAILED]: 'Y'
    };
  }

  getDeliveryFeeRow(clientInvoice, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(clientInvoice, refNumber),
      [MEMO]: `Delivery Fees ${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
      [ITEM]: 'Delivery Fees:Delivery Fees',
      [DESCRIPTION]: `${moment(this.periodStart).format('MM/DD/YYYY')}-${moment(this.periodEnd).format('MM/DD/YYYY')}`,
      [PRICE]: clientInvoice.getDeliveryFeeTotal(),
    });
  }

  getAdminFeeRow(clientInvoice, refNumber) {
    return this.orderFields({
      ...this.getCommonFields(clientInvoice, refNumber),
      [MEMO]: `Administrative Fees ${moment(this.monthStart).format('MM/DD/YYYY')}-${moment(this.monthEnd).format('MM/DD/YYYY')}`,
      [ITEM]: `Monthly Admin Fee:$${clientInvoice.getAdminFee()} Monthly Fee`,
      [DESCRIPTION]: `${moment(this.monthStart).format('MM/DD/YYYY')}-${moment(this.monthEnd).format('MM/DD/YYYY')}`,
      [PRICE]: clientInvoice.getAdminFee(),
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
    this.clientInvoices.forEach((clientInvoice, n) => {
      rows.push(this.getDeliveryFeeRow(clientInvoice, n));
      if (clientInvoice.isMonthEnd) {
        rows.push(this.getAdminFeeRow(clientInvoice, n));
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

module.exports = QuickbooksInvoice;
