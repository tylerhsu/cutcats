import QuickbooksPayrollNonInvoicedIncome from './QuickbooksPayrollNonInvoicedIncome';
import CourierPaystub from './CourierPaystub';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('QuickbooksPayrollNonInvoicedIncome', function() {
  it('constructor does not throw', function() {
    (() => {
      const courierPaystubs = {};
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      new QuickbooksPayrollNonInvoicedIncome(courierPaystubs, periodStart, periodEnd);
    }).should.not.throw();
  });

  it('this.getOrderedFields() returns a list of strings', function() {
    const invoice = new QuickbooksPayrollNonInvoicedIncome();
    const orderedFields = invoice.getOrderedFields();
    orderedFields.should.be.an.Array();
    orderedFields.forEach(field => field.should.be.a.String());
  });

  it('this.getCsvRows() returns an array', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = fixtureModelArray('Ride', { courier, client }, 3);
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-2');
    const courierPaystubs = [new CourierPaystub(courier, rides, periodStart, periodEnd)];
    const quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(courierPaystubs, periodStart, periodEnd);
    const rows = quickbooksPayrollNonInvoicedIncome.getCsvRows();
    rows.should.be.an.Array();
    rows.should.have.length(courierPaystubs.length + 1);
  });

  it('this.getCsvRows() includes a top row whose amount is negative the sum of the other rows\' amounts', function() {
    const client = fixtureModel('Client', { paymentType: 'paid' });
    const courier = fixtureModel('Courier');
    const rides = fixtureModelArray('Ride', {
      courier,
      client,
      deliveryFee: 1,
      readyTime: new Date('2000-1-10')
    }, 3);
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-31');
    const courierPaystubs = [
      new CourierPaystub(courier, rides, periodStart, periodEnd),
      new CourierPaystub(courier, rides, periodStart, periodEnd)
    ];
    const quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(courierPaystubs, periodStart, periodEnd);
    const rows = quickbooksPayrollNonInvoicedIncome.getCsvRows();
    rows.should.have.length(3);
    rows[0].Amount.should.eql(-(rows[1].Amount + rows[2].Amount));
  });

  describe('this.getRow()', function() {
    beforeEach(function() {
      this.courier = fixtureModel('Courier');
      this.client = fixtureModel('Client', { paymentType: 'paid' });
      this.rides = fixtureModelArray('Ride', {
        courier: this.courier,
        client: this.client,
        deliveryFee: 1,
        readyTime: new Date('2000-1-10')
      }, 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-31');
      this.courierPaystubs = [new CourierPaystub(this.courier, this.rides, this.periodStart, this.periodEnd)];
      this.quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(this.courierPaystubs, this.periodStart, this.periodEnd);
    });

    it('returns an object with expected values', function() {
      const row = this.quickbooksPayrollNonInvoicedIncome.getRow(this.courierPaystubs[0], 1);
      row.should.eql({
        Num: 1,
        Name: 'fixture courier',
        Date: '01/31/2000',
        Memo: 'Cash Rides Payout',
        Account: 'Guaranteed Pay to Partners:Delivery Fee Payout',
        Amount: 3,
        Class: 'CutCats'
      });
    });
  });
});
