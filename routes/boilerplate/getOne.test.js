import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../../models';
import boilerplate from '.';
import { save, getId, idsShouldBeEqual } from '../util/testUtils';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('boilerplate.getOne()', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  it('returns the document with the given id', function() {
    const invoices = fixtureModelArray('Invoice', 3);
    this.req.params = { id: getId(invoices[1]) };
    return save(invoices)
      .then(() => {
        return boilerplate.getOne(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        idsShouldBeEqual(jsonResponse, invoices[1]);
      });
  });

  it('respects ?populate', function() {
    const courier = fixtureModel('Courier');
    const ride = fixtureModel('Ride', { courier });
    this.req.params = { id: getId(ride) };
    this.req.query.populate = 'courier';
    return save(courier, ride)
      .then(() => {
        return boilerplate.getOne(models.Ride)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.courier.should.be.an.instanceOf(models.Courier);
        idsShouldBeEqual(jsonResponse.courier, courier);
      });
  });
});
