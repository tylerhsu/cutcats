import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import invoiceRoutes from '../routes/invoices';
import models from '../models';
import { save, idsShouldBeEqual } from './util/testUtils';
import { fixture, fixtureArray } from '../models/fixtures';

describe('invoices routes', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  describe('GET /api/invoices', function () {
    it('returns a list of invoices', function() {
      const invoices = fixtureArray('Invoice', 3).map(models.Invoice);
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
        fixture('Invoice', { periodStart: new Date('2000-01-01'), periodEnd: new Date('2000-01-15') }),
        fixture('Invoice', { periodStart: new Date('2001-01-01'), periodEnd: new Date('2001-01-15') }),
        fixture('Invoice', { periodStart: new Date('2002-01-01'), periodEnd: new Date('2002-01-15') })
      ].map(models.Invoice);
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
      this.req.body = fixture('Invoice', { filePath: 'testCreate' });
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
      this.req.invoice = new models.Invoice(fixture('Invoice', { filePath: 'old' }));
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
});
