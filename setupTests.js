const connection = require('./testDbConnection');
const enzyme = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');
enzyme.configure({ adapter: new EnzymeAdapter() });

beforeEach(function() {
  return connection.connected.then(() => {
    return connection.db.dropDatabase();
  });
});
