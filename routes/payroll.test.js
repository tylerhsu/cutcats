import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import payroll from '../routes/payroll';

describe('payroll routes', function () {
  beforeEach(function () {
    this.req = new MockRequest();
    this.res = new MockResponse();
    sinon.spy(this.res, 'json');
  });

  describe('getPayroll()', function () {
    it('works', function () {
      this.req.query.from = new Date();
      this.req.query.to = new Date(Date.now() + 10000);
      return payroll.getPayroll(this.req, this.res)
        .then(() => {
          this.res.statusCode.should.eql(200);
        });
    });
  });
});
