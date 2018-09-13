import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../../models';
import boilerplate from '.';
import { save, getId } from '../util/testUtils';
import { fixtureModelArray } from '../../models/fixtures';

describe('boilerplate.destroy()', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  it('returns 204 and removes the document with the given id', function () {
    const invoices = fixtureModelArray('Invoice', 3);
    this.req.params = { id: getId(invoices[1]) };
    return save(invoices)
      .then(() => {
        return boilerplate.destroy(models.Invoice)(this.req, this.res);
      })
      .then(() => {
        this.res.statusCode.should.eql(204);
        return models.Invoice.find().exec();
      })
      .then(invoices => {
        invoices.should.have.length(2);
        invoices.map(getId).should.not.containEql(this.req.params.id);
      });
  });
});
