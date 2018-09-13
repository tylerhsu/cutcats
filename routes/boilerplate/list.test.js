import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../../models';
import boilerplate from '.';
import { save, idsShouldBeEqual } from '../util/testUtils';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('boilerplate.list()', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  it('returns a list of the given model', function() {
    const invoices = fixtureModelArray('Invoice', 3);
    return save(invoices)
      .then(() => {
        return boilerplate.list(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.should.have.length(3);
      });
  });
  
  it('respects ?sort', function () {
    const invoices = [
      fixtureModel('Invoice', { periodStart: new Date('2000-1-1') }),
      fixtureModel('Invoice', { periodStart: new Date('2002-1-1') }),
      fixtureModel('Invoice', { periodStart: new Date('2001-1-1') })
    ];
    this.req.query.sort = 'periodStart';
    return save(invoices)
      .then(() => {
        return boilerplate.list(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.should.have.length(3);
        idsShouldBeEqual(jsonResponse[0], invoices[0]);
        idsShouldBeEqual(jsonResponse[1], invoices[2]);
        idsShouldBeEqual(jsonResponse[2], invoices[1]);
      });
  });

  it('respects ?populate', function() {
    const courier = fixtureModel('Courier');
    const ride = fixtureModel('Ride', { courier });
    this.req.query.populate = 'courier';
    return save(courier, ride)
      .then(() => {
        return boilerplate.list(models.Ride)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.should.have.length(1);
        jsonResponse[0].courier.should.be.an.instanceOf(models.Courier);
        idsShouldBeEqual(jsonResponse[0].courier, courier);
      });
  });

  it('if ?count=true, responds with { count: <number> }', function() {
    const invoices = fixtureModelArray('Invoice', 3);
    this.req.query.count = 'true';
    return save(invoices)
      .then(() => {
        return boilerplate.list(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.should.eql({ count: 3 });
      });
  });

  it('respects ?page and ?resultsPerPage', function() {
    const invoices = [
      fixtureModel('Invoice', { periodStart: new Date('2000-1-1') }),
      fixtureModel('Invoice', { periodStart: new Date('2001-1-1') }),
      fixtureModel('Invoice', { periodStart: new Date('2002-1-1') })
    ];
    this.req.query.sort = 'periodStart';
    this.req.query.resultsPerPage = '1';
    this.req.query.page = '2';
    return save(invoices)
      .then(() => {
        return boilerplate.list(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.should.have.length(1);
        idsShouldBeEqual(jsonResponse[0], invoices[1]);
      });
  });
});
