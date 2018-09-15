const csv = require('csv');

class QuickbooksExport {
  constructor(periodStart, periodEnd) {
    this.periodStart = new Date(periodStart);
    this.periodEnd = new Date(periodEnd);
  }

  getOrderedFields() {
    throw new Error('Not implemented');
  }

  orderFields(row) {
    const numFieldsInRow = Object.keys(row).length;
    const numFieldsExpected = Object.keys(this.getOrderedFields()).length;
    if (numFieldsInRow !== numFieldsExpected) {
      throw new Error(`Expected ${numFieldsExpected} but got ${numFieldsInRow}`);
    }
    return this.getOrderedFields().reduce((memo, fieldName) => {
      memo[fieldName] = row[fieldName];
      return memo;
    }, {});
  }

  getCsvRows() {
    throw new Error('Not implemented');
  }

  renderCsv() {
    return new Promise((resolve, reject) => {
      csv.stringify(this.getCsvRows(), { header: true }, (err, data) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    });
  }
}

module.exports = QuickbooksExport;
