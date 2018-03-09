import MockRequest from 'mock-express-request';
import MockResponse from 'mock-express-response';
import sinon from 'sinon';
import reports from '../routes/reports';

xdescribe('reports routes', function() {
    beforeEach(function() {
        this.req = new MockRequest();
        this.res = new MockResponse();
    });
    
    describe('getPayroll()', function() {
        it('works', function() {
            return reports.getPayroll(this.req, this.res)
                .then(() => {
                    console.log(this.res.json.firstCall.args);
                });
        });
    });
});
