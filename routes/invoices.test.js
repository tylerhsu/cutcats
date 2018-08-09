import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../models';
import invoiceRoutes from '../routes/invoices';
import { save, getId, idsShouldBeEqual } from './util/testUtils';
import { fixtureJson, fixtureModel, fixtureModelArray } from '../models/fixtures';

describe('invoices routes', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  describe('GET /api/invoices', function () {
    it('returns a list of invoices', function() {
      const invoices = fixtureModelArray('Invoice', 3);
      return save(invoices)
        .then(() => {
          return invoiceRoutes.getInvoices(this.req, this.res);
        })
        .then(() => {
          this.res.statusCode.should.eql(200);
          const jsonResponse = this.res.json.firstCall.args[0];
          jsonResponse.should.have.length(3);
        });
    });
    
    it('respects ?from and ?to', function () {
      const invoices = [
        fixtureModel('Invoice', { periodStart: new Date('2000-01-01'), periodEnd: new Date('2000-01-15') }),
        fixtureModel('Invoice', { periodStart: new Date('2001-01-01'), periodEnd: new Date('2001-01-15') }),
        fixtureModel('Invoice', { periodStart: new Date('2002-01-01'), periodEnd: new Date('2002-01-15') })
      ];
      this.req.query.from = new Date('2000-12-01');
      this.req.query.to = new Date('2001-02-01');
      return save(invoices)
        .then(() => {
          return invoiceRoutes.getInvoices(this.req, this.res);
        })
        .then(() => {
          this.res.statusCode.should.eql(200);
          const jsonResponse = this.res.json.firstCall.args[0];
          jsonResponse.should.have.length(1);
          idsShouldBeEqual(jsonResponse[0], invoices[1]);
        });
    });
  });

  describe('POST /api/invoices', function () {
    it('creates a new Invoice', function () {
      this.req.body = fixtureJson('Invoice', { filePath: 'testCreate' });
      return invoiceRoutes.createInvoice(this.req, this.res)
        .then(() => {
          this.res.statusCode.should.eql(201);
          const jsonResponse = this.res.json.firstCall.args[0];
          jsonResponse.filePath.should.eql(this.req.body.filePath);
        });
    });
  });

  describe('PATCH /api/invoices/:id', function () {
    it('edits an existing Invoice', function () {
      this.req.invoice = fixtureModel('Invoice', { filePath: 'old' });
      this.req.body = { filePath: 'updated' };
      return invoiceRoutes.editInvoice(this.req, this.res)
        .then(() => {
          this.res.statusCode.should.eql(200);
          const jsonResponse = this.res.json.firstCall.args[0];
          idsShouldBeEqual(jsonResponse, this.req.invoice);
          jsonResponse.filePath.should.eql(this.req.body.filePath);
        });
    });
  });

  describe('generateInvoices()', function () {
    it('produces a list of ClientInvoices, one for each Client', function () {
      const clients = fixtureModelArray('Client', 2);
      const commonRideAttrs = { readyTime: new Date('2000-01-02'), deliveryStatus: 'complete' };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, client: clients[0] }),
        fixtureModel('Ride', { ...commonRideAttrs, client: clients[1] })
      ];
      this.req.query.from = new Date('2000-01-01');
      this.req.query.to = new Date('2000-01-03');
      return save(clients, rides)
        .then(() => {
          return invoiceRoutes.generateInvoices(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.clientInvoices.should.have.length(2);
          this.req.clientInvoices.forEach(clientInvoice => {
            clients.map(getId).should.containEql(getId(clientInvoice.client));
          });
        });
    });

    it('each ClientInvoice contains a list of rides belonging to that client', function () {
      const clients = fixtureModelArray('Client', 2);
      const commonRideAttrs = { readyTime: new Date('2000-01-02'), deliveryStatus: 'complete' };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, client: clients[0] }),
        fixtureModel('Ride', { ...commonRideAttrs, client: clients[1] }),
        fixtureModel('Ride', { ...commonRideAttrs, client: clients[1] })
      ];
      this.req.query.from = new Date('2000-01-01');
      this.req.query.to = new Date('2000-01-03');
      return save(clients, rides)
        .then(() => {
          return invoiceRoutes.generateInvoices(this.req, this.res, sinon.stub());
        })
        .then(() => {
          const client0Invoice = this.req.clientInvoices.find(clientInvoice => getId(clientInvoice.client) === getId(clients[0]));
          const client1Invoice = this.req.clientInvoices.find(clientInvoice => getId(clientInvoice.client) === getId(clients[1]));
          client0Invoice.rides.should.have.length(1);
          client0Invoice.rides.forEach(ride => idsShouldBeEqual(ride.client, clients[0]));
          client1Invoice.rides.should.have.length(2);
          client1Invoice.rides.forEach(ride => idsShouldBeEqual(ride.client, clients[1]));
        });
    });

    it('respects ?from and ?to dates', function () {
      const client = fixtureModel('Client');
      const commonRideAttrs = { deliveryStatus: 'complete', client };
      const rides = [
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-01-01') }),
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-02-01') }),
        fixtureModel('Ride', { ...commonRideAttrs, readyTime: new Date('2000-03-01') }),
      ];
      this.req.query.from = new Date('2000-01-20');
      this.req.query.to = new Date('2000-02-20');
      return save(client, rides)
        .then(() => {
          return invoiceRoutes.generateInvoices(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.clientInvoices.should.have.length(1);
          this.req.clientInvoices[0].rides.should.have.length(1);
          idsShouldBeEqual(this.req.clientInvoices[0].rides[0], rides[1]);
          this.req.clientInvoices[0].fromDate.valueOf().should.eql(this.req.query.from.valueOf());
          this.req.clientInvoices[0].toDate.valueOf().should.eql(this.req.query.to.valueOf());
        });
    });

    it('only includes rides with deliveryStatus == "complete"', function() {
      const client = fixtureModel('Client');
      const commonRideAttrs = { readyTime: new Date('2000-01-02'), client };
      const rides = models.Ride.schema.paths.deliveryStatus.enumValues.map(deliveryStatus => {
        return fixtureModel('Ride', { ...commonRideAttrs, deliveryStatus });
      });
      this.req.query.from = new Date('2000-01-01');
      this.req.query.to = new Date('2000-01-03');
      return save(client, rides)
        .then(() => {
          return invoiceRoutes.generateInvoices(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.clientInvoices.should.have.length(1);
          this.req.clientInvoices[0].rides.should.have.length(1);
          this.req.clientInvoices[0].rides[0].deliveryStatus.should.eql('complete');
        });
    });

    it('each client invoice contains a count of that client\'s rides for the entire month', function() {
      const client = fixtureModel('Client');
      const commonRideAttrs = { readyTime: new Date('2000-01-01'), deliveryStatus: 'complete', client };
      const rides = fixtureModelArray('Ride', commonRideAttrs, 3);
      this.req.query.from = new Date('2000-01-15');
      this.req.query.to = new Date('2000-01-31');
      return save(client, rides)
        .then(() => {
          return invoiceRoutes.generateInvoices(this.req, this.res, sinon.stub());
        })
        .then(() => {
          this.req.clientInvoices.should.have.length(1);
          this.req.clientInvoices[0].rides.should.have.length(0);
          this.req.clientInvoices[0].monthRideCount.should.eql(3);
        });
    });
  });
});
