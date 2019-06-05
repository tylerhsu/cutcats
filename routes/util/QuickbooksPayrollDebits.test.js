import QuickbooksPayrollDebits from './QuickbooksPayrollDebits';
import CourierPaystub from './CourierPaystub';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('QuickbooksPayrollDebits', function() {
  it('constructor does not throw', function() {
    (() => {
      const courierPaystubs = {};
      const periodStart = new Date('2000-1-1');
      const periodEnd = new Date('2000-1-1');
      new QuickbooksPayrollDebits(courierPaystubs, periodStart, periodEnd);
    }).should.not.throw();
  });

  it('this.getOrderedFields() returns a list of strings', function() {
    const invoice = new QuickbooksPayrollDebits();
    const orderedFields = invoice.getOrderedFields();
    orderedFields.should.be.an.Array();
    orderedFields.forEach(field => field.should.be.a.String());
  });

  describe('this.getCsvRows()', function() {
    beforeEach(function() {
      this.courier = fixtureModel('Courier');
      this.client = fixtureModel('Client');
      this.rides = fixtureModelArray('Ride', {
        courier: this.courier,
        client: this.client,
        readyTime: new Date('2000-1-2'),
        deliveryFee: 4
      }, 3);
      this.periodStart = new Date('2000-1-1');
      this.periodEnd = new Date('2000-1-3');
    });
    
    it('returns an array', function() {
      const courierPaystubs = [new CourierPaystub(this.courier, this.rides, this.periodStart, this.periodEnd)];
      const quickbooksPayrollDebits = new QuickbooksPayrollDebits(courierPaystubs, this.periodStart, this.periodEnd);
      const rows = quickbooksPayrollDebits.getCsvRows();
      rows.should.be.an.Array();
    });

    it('includes radio fee rows when there are radio fees', function() {
      this.courier.monthlyRadioRental = true;
      this.periodEnd = new Date('2000-1-31');
      const courierPaystubs = [new CourierPaystub(this.courier, this.rides, this.periodStart, this.periodEnd)];
      const quickbooksPayrollDebits = new QuickbooksPayrollDebits(courierPaystubs, this.periodStart, this.periodEnd);
      const rows = quickbooksPayrollDebits.getCsvRows();
      rows.should.have.length(courierPaystubs.length);
      rows[0].should.eql({
        'RefNumber': 0,
        'CutCat Name': 'fixture courier',
        'Date': '01/31/2000',
        'Expense Account': 'Radio Service Fees:Rider Monthly Service Fees',
        'Expense Amount': 20,
        'Expense Memo': 'Radio Unit',
        'Expense Class': 'CutCats',
        'AP Account': 'Accounts Payable'
      });
    });

    it('excludes radio fee row when radio fee is zero', function() {
      this.courier.monthlyRadioRental = false;
      const courierPaystubs = [new CourierPaystub(this.courier, this.rides, this.periodStart, this.periodEnd)];
      const quickbooksPayrollDebits = new QuickbooksPayrollDebits(courierPaystubs, this.periodStart, this.periodEnd);
      const rows = quickbooksPayrollDebits.getCsvRows();
      rows.should.have.length(0);
    });
  });
});
