const moment = require('moment');
const AWS = require('aws-sdk');

class AccountingPeriod {
  constructor(ridesInMonth, periodStart, periodEnd, lambda) {
    this.periodStart = new Date(periodStart);
    this.periodEnd = new Date(periodEnd);
    this.ridesInMonth = ridesInMonth;
    this.ridesInPeriod = ridesInMonth.filter(ride => {
      const readyTime = new Date(ride.readyTime);
      return readyTime >= this.periodStart && readyTime < this.periodEnd;
    });
    this.isMonthEnd = moment(periodEnd).date() === moment(periodEnd).endOf('month').date();
    this.lambda = lambda || new AWS.Lambda();
  }

  getDateRange() {
    return `${moment(this.periodStart).format('MMM Do, YYYY')} - ${moment(this.periodEnd).format('MMM Do, YYYY')}`;
  }

  getNumRidesInPeriod() {
    return this.ridesInPeriod.length;
  }

  getNumRidesInMonth() {
    return this.ridesInMonth.length;
  }

  getPdfDocDefinition() {
    return {};
  }

  renderPdf () {
    return new Promise((resolve, reject) => {
      this.lambda.invoke({
        FunctionName: process.env.PDF_SERVICE,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(this.getPdfDocDefinition)
      }, (err, response) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(new Buffer(JSON.parse(response.Payload).data));
        }
      });
    });
  }
}

module.exports = AccountingPeriod;
