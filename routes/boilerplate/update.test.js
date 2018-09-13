import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../../models';
import boilerplate from '.';
import { save, getId, idsShouldBeEqual } from '../util/testUtils';
import { fixtureModel, fixtureModelArray } from '../../models/fixtures';

describe('boilerplate.update()', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  it('updates the document with the given id', function() {
    const invoices = fixtureModelArray('Invoice', 3);
    this.req.params = { id: getId(invoices[1]) };
    this.req.body = { filePath: 'testUpdate' };
    return save(invoices)
      .then(() => {
        return boilerplate.update(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        idsShouldBeEqual(jsonResponse, invoices[1]);
        jsonResponse.filePath.should.eql(this.req.body.filePath);
      });
  });

  it('respects ?populate', function() {
    const couriers = fixtureModelArray('Courier', 2);
    const ride = fixtureModel('Ride', { courier: couriers[0] });
    this.req.params = { id: getId(ride) };
    this.req.body = { courier: getId(couriers[1]) };
    this.req.query.populate = 'courier';
    return save(couriers, ride)
      .then(() => {
        return boilerplate.update(models.Ride)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(200);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.courier.should.be.an.instanceOf(models.Courier);
        idsShouldBeEqual(jsonResponse.courier, couriers[1]);
      });
  });
});
