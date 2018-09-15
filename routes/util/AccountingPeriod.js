const moment = require('moment');
const AWS = require('aws-sdk');

class AccountingPeriod {
  constructor(rides, periodStart, periodEnd, lambda) {
    this.periodStart = new Date(periodStart);
    this.periodEnd = new Date(periodEnd);
    this.rides = rides;
    this.ridesInPeriod = rides.filter(ride => {
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

  getPdfDocDefinition() {
    return {};
  }

  renderPdf () {
    return new Promise((resolve, reject) => {
      this.lambda.invoke({
        FunctionName: process.env.PDF_SERVICE,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(this.getPdfDocDefinition())
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
