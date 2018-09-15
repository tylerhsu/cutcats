import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import should from 'should';
import sinon from 'sinon';
import models from '../models';
import yazl from 'yazl';
import payrollRoutes from './payrolls';
import CourierPaystub from './util/CourierPaystub';
import QuickbooksPayrollCredits from './util/QuickbooksPayrollCredits';
import QuickbooksPayrollDebits from './util/QuickbooksPayrollDebits';
import QuickbooksPayrollNonInvoicedIncome from './util/QuickbooksPayrollNonInvoicedIncome';
import { save, getId, idsShouldBeEqual } from './util/testUtils';
import { fixtureModel, fixtureModelArray } from '../models/fixtures';

describe('payrolls routes', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  describe('getPayrolls()', function () {
    it('respects ?from and ?to', function () {
      const payrolls = [
        fixtureModel('Payroll', { periodStart: new Date('2000-1-1'), periodEnd: new Date('2000-1-15') }),
        fixtureModel('Payroll', { periodStart: new Date('2001-1-1'), periodEnd: new Date('2001-1-15') }),
        fixtureModel('Payroll', { periodStart: new Date('2002-1-1'), periodEnd: new Date('2002-1-15') })
      ];
      this.req.query.from = new Date('2000-12-1');
      this.req.query.to = new Date('2001-2-1');
      return save(payrolls)
        .then(() => {
          return payrollRoutes.getPayrolls(this.req, this.res);
        })
        .then(() => {
          this.res.statusCode.should.eql(200);
          const jsonResponse = this.res.json.firstCall.args[0];
          jsonResponse.should.have.length(1);
          idsShouldBeEqual(jsonResponse[0], payrolls[1]);
        });
    });
  });

  describe('createPayrollZip()', function() {
    it('assigns req.payrollZip and calls next()', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = fixtureModelArray('Ride', { courier, client }, 3);
      const lambda = {
        invoke: sinon.stub().callsArgWith(1, null, { Payload: '{ "data": [] }' })
      };
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-1');
      this.req.courierPaystubs = [
        new CourierPaystub(courier, rides, this.req.query.periodStart, this.req.query.periodEnd, lambda)
      ];
      this.req.quickbooksPayrollCredits = new QuickbooksPayrollCredits(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      this.req.quickbooksPayrollDebits = new QuickbooksPayrollDebits(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      this.req.quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      return new Promise(resolve => payrollRoutes.createPayrollZip(this.req, this.res, resolve))
        .then(err => {
          if (err) throw err;
          this.req.payrollZip.should.be.ok();
          return new Promise((resolve, reject) => {
            this.req.payrollZip.outputStream.on('data', () => {});
            this.req.payrollZip.outputStream.on('finish', resolve);
            this.req.payrollZip.outputStream.on('error', reject);
          });
        });
    });

    it('assigns req.payrollZipSize a promise that resolves with a number', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const rides = fixtureModelArray('Ride', { courier, client }, 3);
      const lambda = {
        invoke: sinon.stub().callsArgWith(1, null, { Payload: '{ "data": [] }' })
      };
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-1');
      this.req.courierPaystubs = [
        new CourierPaystub(courier, rides, this.req.query.periodStart, this.req.query.periodEnd, lambda)
      ];
      this.req.quickbooksPayrollCredits = new QuickbooksPayrollCredits(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      this.req.quickbooksPayrollDebits = new QuickbooksPayrollDebits(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      this.req.quickbooksPayrollNonInvoicedIncome = new QuickbooksPayrollNonInvoicedIncome(this.req.courierPaystubs, this.req.query.periodStart, this.req.query.periodEnd);
      return new Promise(resolve => payrollRoutes.createPayrollZip(this.req, this.res, resolve))
        .then(err => {
          if (err) throw err;
          this.req.payrollZipSize.should.be.a.Number();
        });
    });
  });

  describe('servePayrollZip()', function() {
    it('pipes req.payrollZip into response and finishes successfully', function() {
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-1');
      this.req.payrollZip = new yazl.ZipFile();
      payrollRoutes.servePayrollZip(this.req, this.res);
      this.req.payrollZip.end();
      return new Promise((resolve, reject) => {
        this.res.on('data', () => {});
        this.res.on('finish', resolve);
        this.res.on('error', reject);
      });
    });
  });

  describe('savePayrollZip()', function() {
    it('calls s3.putObject() and saves an Payroll to the db', function() {
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-1');
      this.req.payrollZip = new yazl.ZipFile();
      this.req.payrollZipSize = new Promise(resolve => resolve(1));
      const s3 = {
        putObject: sinon.stub().callsArgWith(1, null, { foo: 'bar' })
      };
      return payrollRoutes.savePayrollZip(s3)(this.req, this.res, sinon.stub())
        .then(() => {
          s3.putObject.calledOnce.should.be.true();
          this.res.json.firstCall.args[0].should.be.an.Object();
          return models.Payroll.find().exec();
        })
        .then(payrolls => {
          payrolls.should.have.length(1);
          payrolls[0].periodStart.should.eql(this.req.query.periodStart);
          payrolls[0].periodEnd.should.eql(this.req.query.periodEnd);
        });
    });
  });

  describe('generatePaystubs()', function () {
    it('produces a list of CourierPaystubs, one for each Courier', function () {
      const client = fixtureModel('Client');
      const couriers = fixtureModelArray('Courier', 2);
      const commonRideAttrs = { readyTime: new Date('2000-1-2'), deliveryStatus: 'complete', client };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, courier: couriers[0] }),
        fixtureModel('Ride', { ...commonRideAttrs, courier: couriers[1] })
      ];
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-3');
      return save(client, couriers, rides)
        .then(() => {
          return new Promise(resolve => payrollRoutes.generatePaystubs(this.req, this.res, resolve));
        })
        .then(err => {
          if (err) throw err;
          this.req.courierPaystubs.should.have.length(2);
          this.req.courierPaystubs.forEach(courierPaystub => {
            should(courierPaystub.courier.name).be.ok();
            couriers.map(getId).should.containEql(getId(courierPaystub.courier));
          });
        });
    });

    it('each CourierPaystub contains a list of rides belonging to that courier and each ride has the client field populated', function () {
      const client = fixtureModel('Client');
      const couriers = fixtureModelArray('Courier', 2);
      const commonRideAttrs = { readyTime: new Date('2000-1-2'), deliveryStatus: 'complete', client };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, courier: couriers[0] }),
        fixtureModel('Ride', { ...commonRideAttrs, courier: couriers[1] }),
        fixtureModel('Ride', { ...commonRideAttrs, courier: couriers[1] })
      ];
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-3');
      return save(client, couriers, rides)
        .then(() => {
          return new Promise(resolve => payrollRoutes.generatePaystubs(this.req, this.res, resolve));
        })
        .then(err => {
          if (err) throw err;
          const courier0Payroll = this.req.courierPaystubs.find(courierPaystub => getId(courierPaystub.courier) === getId(couriers[0]));
          const courier1Payroll = this.req.courierPaystubs.find(courierPaystub => getId(courierPaystub.courier) === getId(couriers[1]));
          courier0Payroll.ridesInPeriod.should.have.length(1);
          courier0Payroll.ridesInPeriod.forEach(ride => idsShouldBeEqual(ride.courier, couriers[0]));
          courier1Payroll.ridesInPeriod.should.have.length(2);
          courier1Payroll.ridesInPeriod.forEach(ride => idsShouldBeEqual(ride.courier, couriers[1]));
          courier0Payroll.ridesInPeriod.concat(courier1Payroll.ridesInPeriod).forEach(ride => {
            should.ok(ride.client.paymentType, 'Expected client field to be populated');
          });
        });
    });

    it('respects ?periodStart and ?periodEnd dates', function () {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const commonRideAttrs = { deliveryStatus: 'complete', courier, client };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-1-1') }),
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-2-1') }),
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-3-1') }),
      ];
      this.req.query.periodStart = new Date('2000-1-20');
      this.req.query.periodEnd = new Date('2000-2-20');
      return save(client, courier, rides)
        .then(() => {
          return new Promise(resolve => payrollRoutes.generatePaystubs(this.req, this.res, resolve));
        })
        .then(err => {
          if (err) throw err;
          this.req.courierPaystubs.should.have.length(1);
          this.req.courierPaystubs[0].ridesInPeriod.should.have.length(1);
          idsShouldBeEqual(this.req.courierPaystubs[0].ridesInPeriod[0], rides[1]);
          this.req.courierPaystubs[0].periodStart.valueOf().should.eql(this.req.query.periodStart.valueOf());
          this.req.courierPaystubs[0].periodEnd.valueOf().should.eql(this.req.query.periodEnd.valueOf());
        });
    });

    it('only includes rides with deliveryStatus == "complete"', function() {
      const client = fixtureModel('Client');
      const courier = fixtureModel('Courier');
      const commonRideAttrs = { readyTime: new Date('2000-1-2'), courier, client };
      const rides = models.Ride.schema.paths.deliveryStatus.enumValues.map(deliveryStatus => {
        return fixtureModel('Ride', { ...commonRideAttrs, deliveryStatus });
      });
      this.req.query.periodStart = new Date('2000-1-1');
      this.req.query.periodEnd = new Date('2000-1-3');
      return save(client, courier, rides)
        .then(() => {
          return payrollRoutes.generatePaystubs(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.courierPaystubs.should.have.length(1);
          this.req.courierPaystubs[0].ridesInPeriod.should.have.length(1);
          this.req.courierPaystubs[0].ridesInPeriod[0].deliveryStatus.should.eql('complete');
        });
    });

    it('produces a QuickbooksPayrollCredits, QuickbooksPayrollDebits, and QuickbooksPayrollNonInvoicedIncome', function() {
      const courier = fixtureModel('Courier');
      const rides = fixtureModelArray('Ride', 3);
      this.req.query.periodStart = new Date('2000-1-15');
      this.req.query.periodEnd = new Date('2000-1-31');
      return save(courier, rides)
        .then(() => {
          return payrollRoutes.generatePaystubs(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.quickbooksPayrollCredits.should.be.ok();
          this.req.quickbooksPayrollDebits.should.be.ok();
          this.req.quickbooksPayrollNonInvoicedIncome.should.be.ok();
        });
    });
  });
});
