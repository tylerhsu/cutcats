import AccountingPeriod from './AccountingPeriod';
import { getId } from './testUtils';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('AccountingPeriod', function() {
  it('constructor assigns the expected member variables', function() {
    const rides = fixtureModelArray('Ride', 3);
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-2');
    const accountingPeriod = new AccountingPeriod(rides, periodStart, periodEnd);
    accountingPeriod.periodStart.should.be.a.Date();
    accountingPeriod.periodStart.should.eql(periodStart);
    accountingPeriod.periodEnd.should.be.a.Date();
    accountingPeriod.periodEnd.should.eql(periodEnd);
    accountingPeriod.rides.should.be.an.Array();
    accountingPeriod.ridesInPeriod.should.be.an.Array();
    accountingPeriod.isMonthEnd.should.be.a.Boolean();
  });

  it('this.ridesInPeriod gets set correctly', function() {
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-5') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-10') })
    ];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-6');
    const accountingPeriod = new AccountingPeriod(rides, periodStart, periodEnd);
    accountingPeriod.ridesInPeriod.should.have.length(2);
    accountingPeriod.rides.should.have.length(3);
    accountingPeriod.ridesInPeriod.map(getId).should.containEql(getId(rides[0]));
    accountingPeriod.ridesInPeriod.map(getId).should.containEql(getId(rides[1]));
  });

  it('this.isMonthEnd is true when periodEnd falls on the last date of the month, and false otherwise', function() {
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const shouldNotBeMonthEnd = [
      new AccountingPeriod(rides, periodStart, new Date('2000-1-30')),
      new AccountingPeriod(rides, periodStart, new Date('2000-2-30')),
      new AccountingPeriod(rides, periodStart, new Date('2000-2-31')),
      new AccountingPeriod(rides, periodStart, new Date('2000-2-28')) // LEAP YEAR!!
    ];
    const shouldBeMonthEnd = [
      new AccountingPeriod(rides, periodStart, new Date('2000-1-31')),
      new AccountingPeriod(rides, periodStart, new Date('2000-2-29')), // LEAP YEAR!!
      new AccountingPeriod(rides, periodStart, new Date('2001-2-28')),
      new AccountingPeriod(rides, new Date('2000-1-15'), new Date('2000-1-31'))
    ];
    shouldNotBeMonthEnd.forEach((accountingPeriod, n) => accountingPeriod.isMonthEnd.should.be.false(`Expected accountingPeriod[${n}].isMonthEnd to be false`));
    shouldBeMonthEnd.forEach((accountingPeriod, n) => accountingPeriod.isMonthEnd.should.be.true(`Expected accountingPeriod[${n}].isMonthEnd to be true`));
  });

  it('this.getDateRange() returns a string', function() {
    const rides = [];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-1');
    const accountingPeriod = new AccountingPeriod(rides, periodStart, periodEnd);
    accountingPeriod.getDateRange().should.match(/2000/);
  });

  it('this.getNumRidesInPeriod() returns the number of rides that occurred between periodStart and periodEnd', function() {
    const rides = [
      fixtureModel('Ride', { readyTime: new Date('2000-1-1') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-5') }),
      fixtureModel('Ride', { readyTime: new Date('2000-1-10') })
    ];
    const periodStart = new Date('2000-1-1');
    const periodEnd = new Date('2000-1-6');
    const accountingPeriod = new AccountingPeriod(rides, periodStart, periodEnd);
    accountingPeriod.getNumRidesInPeriod().should.eql(2);
  });
});
