import hydrateFromCsv from '../models/hydrateFromCsv';

describe('hydrateFromCsv()', function () {
  it('returns an object with fields and values mapped from the given csv data', function () {
    const csvRow = {
      'field 1': '1',
      'field 2': 'text'
    };
    const columnMap = {
      'field 1': 'field1',
      'field 2': 'field2'
    };

    return hydrateFromCsv(csvRow, columnMap)
      .then(obj => {
        obj.should.eql({
          field1: '1',
          field2: 'text'
        });
      });
  });

  it('supports { name, hydrate } format', function () {
    const csvRow = {
      'field 1': '1',
      'field 2': 'text'
    };
    const columnMap = {
      'field 1': { name: 'field1', hydrate: hydrateField1 },
      'field 2': { name: 'field2' }
    };

    function hydrateField1 (value, csvData) {
      value.should.eql('1');
      csvData.should.eql(csvRow);
      return value + csvData['field 2'];
    }

    return hydrateFromCsv(csvRow, columnMap)
      .then(obj => {
        obj.should.eql({
          field1: '1text',
          field2: 'text'
        });
      });
  });

  it('supports async hydrate function', function () {
    const csvRow = { 'field 1': '1' };
    const columnMap = {
      'field 1': { name: 'field1', hydrate: hydrateField1 }
    };

    function hydrateField1 (value) {
      return new Promise((resolve) => {
        resolve(parseInt(value) + 1);
      });
    }

    return hydrateFromCsv(csvRow, columnMap)
      .then(obj => {
        obj.should.eql({
          field1: 2
        });
      });
  });

  it('rejects if hydrate function throws an error', function () {
    const csvRow = { 'field 1': '1' };
    const columnMap = {
      'field 1': { name: 'field1', hydrate: hydrateField1 }
    };

    function hydrateField1 () {
      throw new Error('test');
    }

    return hydrateFromCsv(csvRow, columnMap).should.be.rejectedWith('test');
  });

  it('rejects if hydrate function rejects', function () {
    const csvRow = { 'field 1': '1' };
    const columnMap = {
      'field 1': { name: 'field1', hydrate: hydrateField1 }
    };

    function hydrateField1 () {
      return new Promise((resolve, reject) => {
        reject(new Error('test'));
      });
    }

    return hydrateFromCsv(csvRow, columnMap).should.be.rejectedWith('test');
  });

  it('rejects if the column map refers to a column that doesn\'t appear in the csv data', function () {
    const csvRow = { 'field 1': '1' };
    const columnMap = {
      'field 1': 'field1',
      'field 2': 'field2'
    };

    return hydrateFromCsv(csvRow, columnMap).should.be.rejectedWith(/Expected a column named "field 2"/);
  });

  it('is case-insensitive to column names', function () {
    const csvRow = { 'FIELD 1': '1' };
    const columnMap = { 'field 1': 'fieldCamel1' };

    return hydrateFromCsv(csvRow, columnMap)
      .then(obj => {
        obj.should.eql({ fieldCamel1: '1' });
      });
  });
});
