import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import models from '../../models';
import boilerplate from '.';
import { fixtureJson } from '../../models/fixtures';

describe('boilerplate.create()', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  it('returns 201 and creates a new document', function () {
    this.req.body = fixtureJson('Invoice', { filePath: 'testCreate' });
    return boilerplate.create(models.Invoice)(this.req, this.res)
      .then(() => {
        this.res.statusCode.should.eql(201);
        const jsonResponse = this.res.json.firstCall.args[0];
        jsonResponse.filePath.should.eql(this.req.body.filePath);
      });
  });
});
