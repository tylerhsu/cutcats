import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import invoiceRoutes from '../routes/invoices';
import { save, idsShouldBeEqual } from './util/testUtils';
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

  describe('GET /api/invoices/generate', function () {
    it('asdf', function () {
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
          return invoiceRoutes.generateInvoices(this.req, this.res);
        })
        .then(() => {
          this.res.statusCode.should.eql(200);
          /* const jsonResponse = this.res.json.firstCall.args[0];*/
          /* console.log(jsonResponse);*/
        });
    });
  });
});
