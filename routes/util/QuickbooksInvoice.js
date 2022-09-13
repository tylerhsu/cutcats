const moment = require('moment');
const QuickbooksExport = require('./QuickbooksExport');

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

class QuickbooksInvoice extends QuickbooksExport {
  constructor(clientInvoices, periodStart, periodEnd, monthStart, monthEnd) {
    super(periodStart, periodEnd);
    this.clientInvoices = clientInvoices;
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
      [CUSTOMER]: clientInvoice.client.quickbooksName || clientInvoice.client.name,
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
    const isPercentage = clientInvoice.client.adminFeeType === 'percentage';
    const [startDate, endDate] = isPercentage ?
      [this.periodStart, this.periodEnd] :
      [this.monthStart, this.monthEnd];
    return this.orderFields({
      ...this.getCommonFields(clientInvoice, refNumber),
      [MEMO]: `Administrative Fees ${moment(startDate).format('MM/DD/YYYY')}-${moment(endDate).format('MM/DD/YYYY')}`,
      [ITEM]: `${isPercentage ? 'Semi-monthly' : 'Monthly'} Admin Fee:$${clientInvoice.getAdminFee().toFixed(2)} ${isPercentage ? 'Semi-monthly' : 'Monthly'} Fee`,
      [DESCRIPTION]: `${moment(startDate).format('MM/DD/YYYY')}-${moment(endDate).format('MM/DD/YYYY')}`,
      [PRICE]: clientInvoice.getAdminFee().toFixed(2),
    });
  }

  getCsvRows() {
    const rows = [];
    this.clientInvoices.forEach((clientInvoice, n) => {
      rows.push(this.getDeliveryFeeRow(clientInvoice, n));
      if (clientInvoice.isMonthEnd || clientInvoice.client.adminFeeType === 'percentage') {
        rows.push(this.getAdminFeeRow(clientInvoice, n));
      }
    });
    return rows.filter(row => {
      return row[PRICE] !== 0;
    });
  }
}

module.exports = QuickbooksInvoice;
