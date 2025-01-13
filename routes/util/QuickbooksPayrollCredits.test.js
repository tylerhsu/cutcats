import QuickbooksPayrollCredits from './QuickbooksPayrollCredits';
import CourierPaystub from './CourierPaystub';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('QuickbooksPayrollCredits', function() {
  it('constructor does not throw', function() {
    (() => {
      const courierPaystubs = {};
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      new QuickbooksPayrollCredits(courierPaystubs, periodStart, periodEnd);
    }).should.not.throw();
  });

  it('this.getOrderedFields() returns a list of strings', function() {
    const invoice = new QuickbooksPayrollCredits();
    const orderedFields = invoice.getOrderedFields();
    orderedFields.should.be.an.Array();
    orderedFields.forEach(field => field.should.be.a.String());
  });

  it('this.getCsvRows() returns an array', function() {
    const client = fixtureModel('Client');
    const courier = fixtureModel('Courier');
    const rides = fixtureModelArray('Ride', { courier, client, readyTime: new Date('2000-1-10') }, 3);
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-31');
    const courierPaystubs = [new CourierPaystub(courier, rides, periodStart, periodEnd)];
    const quickbooksPayrollCredits = new QuickbooksPayrollCredits(courierPaystubs, periodStart, periodEnd);
    const rows = quickbooksPayrollCredits.getCsvRows();
    rows.should.be.an.Array();
    rows.should.have.length(courierPaystubs.length);
  });

  describe('this.getRow()', function() {
    beforeEach(function() {
      this.courier = fixtureModel('Courier');
      this.client = fixtureModel('Client', { paymentType: 'invoiced' });
      this.rides = fixtureModelArray('Ride', {
        courier: this.courier,
        client: this.client,
        readyTime: new Date('2000-1-10'),
        tip: 1,
        deliveryFee: 2
      }, 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-31');
      this.courierPaystubs = [new CourierPaystub(this.courier, this.rides, this.periodStart, this.periodEnd)];
      this.quickbooksPayrollCredits = new QuickbooksPayrollCredits(this.courierPaystubs, this.periodStart, this.periodEnd);
    });

    it('returns an object with expected values', function() {
      const row = this.quickbooksPayrollCredits.getRow(this.courierPaystubs[0], 1);
      row.should.eql({
        'RefNumber': 1,
        'CutCat Name': 'fixture courier',
        'Date': '01/31/2000',
        'Expense Account': 'Guaranteed Pay to Partners:Delivery Fee Payout',
        'Expense Amount': 6.75,
        'Expense Description': 'Invoiced Rides Payout pay period 01/01/2000-01/31/2000',
        'Expense Class': 'CutCats',
        'AP Account': 'Accounts Payable'
      });
    });

    it('throws an error if the second argument is not supplied', function() {
      (() => {
        this.quickbooksPayrollCredits.getRow(this.courierPaystubs[0]);
      }).should.throw(/refNumber is required/);
    });
  });
});
