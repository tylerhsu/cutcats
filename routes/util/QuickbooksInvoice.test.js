import QuickbooksInvoice from './QuickbooksInvoice';
import ClientInvoice from './ClientInvoice';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('QuickbooksInvoice', function() {
  it('constructor does not throw', function() {
    (() => {
      const clientInvoice = {};
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      const monthStart = new Date('2000-1-1');
      const monthEnd = new Date('2000-1-1');
      new QuickbooksInvoice(clientInvoice, periodStart, periodEnd, monthStart, monthEnd);
    }).should.not.throw();
  });

  it('this.getOrderedFields() returns a list of strings', function() {
    const invoice = new QuickbooksInvoice();
    const orderedFields = invoice.getOrderedFields();
    orderedFields.should.be.an.Array();
    orderedFields.forEach(field => field.should.be.a.String());
  });

  describe('this.getCommonFields()', function() {
    beforeEach(function() {
      this.client = fixtureModel('Client');
      this.rides = fixtureModelArray('Ride', 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-2');
      this.monthStart = new Date('2000-1-3');
      this.monthEnd = new Date('2000-1-4');
      this.clientInvoices = [new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd)];
      this.quickbooksInvoice = new QuickbooksInvoice(this.clientInvoices, this.periodStart, this.periodEnd, this.monthStart, this.monthEnd);
    });

    it('returns an object with expected values', function() {
      const commonFields = this.quickbooksInvoice.getCommonFields(this.clientInvoices[0], 1);
      commonFields.should.eql({
        'Customer': this.client.name,
        'Transaction Date': '01/02/2000',
        'RefNumber': 1,
        'Class': 'CutCats',
        'Due Date': '01/22/2000',
        'Quantity': 1,
        'To Be E-Mailed': 'Y'
      });
    });

    it('throws an error if the second argument is not supplied', function() {
      (() => {
        this.quickbooksInvoice.getCommonFields(this.clientInvoices[0]);
      }).should.throw(/refNumber is required/);
    });
  });

  describe('this.getDeliveryFeeRow()', function() {
    beforeEach(function() {
      this.client = fixtureModel('Client');
      this.rides = fixtureModelArray('Ride', 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-2');
      this.monthStart = new Date('2000-1-3');
      this.monthEnd = new Date('2000-1-4');
      this.clientInvoices = [new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd)];
      this.quickbooksInvoice = new QuickbooksInvoice(this.clientInvoices, this.periodStart, this.periodEnd, this.monthStart, this.monthEnd);
    });

    it('returns an object with expected values', function() {
      const deliveryFeeRow = this.quickbooksInvoice.getDeliveryFeeRow(this.clientInvoices[0], 1);
      deliveryFeeRow.should.eql({
        'Customer': this.client.name,
        'Transaction Date': '01/02/2000',
        'RefNumber': 1,
        'Class': 'CutCats',
        'Due Date': '01/22/2000',
        'Memo': 'Delivery Fees 01/01/2000-01/02/2000',
        'Item': 'Delivery Fees:Delivery Fees',
        'Quantity': 1,
        'Description': '01/01/2000-01/02/2000',
        'Price': this.clientInvoices[0].getDeliveryFeeTotal(),
        'To Be E-Mailed': 'Y'
      });
    });

    it('throws an error if the second argument is not supplied', function() {
      (() => {
        this.quickbooksInvoice.getDeliveryFeeRow(this.clientInvoices[0]);
      }).should.throw(/refNumber is required/);
    });
  });

  describe('this.getAdminFeeRow()', function() {
    beforeEach(function() {
      this.client = fixtureModel('Client');
      this.rides = fixtureModelArray('Ride', 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-2');
      this.monthStart = new Date('2000-1-3');
      this.monthEnd = new Date('2000-1-4');
      this.clientInvoices = [new ClientInvoice(this.client, this.rides, this.periodStart, this.periodEnd)];
      this.quickbooksInvoice = new QuickbooksInvoice(this.clientInvoices, this.periodStart, this.periodEnd, this.monthStart, this.monthEnd);
    });

    it('returns an object with expected values', function() {
      const adminFeeRow = this.quickbooksInvoice.getAdminFeeRow(this.clientInvoices[0], 1);
      adminFeeRow.should.eql({
        'Customer': this.client.name,
        'Transaction Date': '01/02/2000',
        'RefNumber': 1,
        'Class': 'CutCats',
        'Due Date': '01/22/2000',
        'Memo': 'Administrative Fees 01/03/2000-01/04/2000',
        'Item': 'Monthly Admin Fee:$0 Monthly Fee',
        'Quantity': 1,
        'Description': '01/03/2000-01/04/2000',
        'Price': this.clientInvoices[0].getAdminFee(),
        'To Be E-Mailed': 'Y'
      });
    });

    it('throws an error if the second argument is not supplied', function() {
      (() => {
        this.quickbooksInvoice.getAdminFeeRow(this.clientInvoices[0]);
      }).should.throw(/refNumber is required/);
    });
  });
});
