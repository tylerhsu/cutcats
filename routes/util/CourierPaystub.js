const moment = require('moment');
const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');
const logoBase64 = fs.readFileSync(path.resolve(__dirname, './pdf-logo.png')).toString('base64');
const explainable = require('./explainable');

class CourierPaystub {
  constructor(courier, ridesInMonth, periodStart, periodEnd, lambda) {
    this.courier = courier;
    this.periodStart = new Date(periodStart),
    this.periodEnd = new Date(periodEnd);
    this.ridesInMonth = ridesInMonth;
    this.ridesInPeriod = ridesInMonth.filter(ride => {
      const readyTime = new Date(ride.readyTime);
      return readyTime >= this.periodStart && readyTime < this.periodEnd;
    });
    this.isMonthEnd = moment(periodEnd).date() === moment(periodEnd).endOf('month').date();

    this.getAdminFee = explainable(this.getAdminFee.bind(this));
    this.getTipTotal = explainable(this.getTipTotal.bind(this));
    this.getFeeTotal = explainable(this.getFeeTotal.bind(this));
    this.getDeliveryFeeTotal = explainable(this.getDeliveryFeeTotal.bind(this));
    this.lambda = lambda || new AWS.Lambda();
  }

  getCourierName() {
    return this.courier.name;
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

  getAdminFee() {
    return [1, 'test admin fee'];
  }

  getTipTotal () {
    return [2, 'test tip total'];
  }

  getFeeTotal () {
    return [3, 'test fee total'];
  }

  getDeliveryFeeTotal() {
    return [4, 'Tips + fees'];
  }

  getPaystubTotal () {
    return this.getAdminFee() + this.getDeliveryFeeTotal();
  }

  renderPdf () {
    const title = `${this.courier.name} Paystub, ${this.getDateRange()}`;
    const { value: adminFee, reason: adminFeeReason } = this.getAdminFee({ explain: true });
    const { value: tipTotal, reason: tipTotalReason } = this.getTipTotal({ explain: true });
    const { value: feeTotal, reason: feeTotalReason } = this.getFeeTotal({ explain: true });
    const docDefinition = {
      info: {
        title,
        author: 'Cut Cats'
      },
      content: [
        {
          image: 'data:image/png;base64,' + logoBase64,
          width: 75,
          absolutePosition: { x: 490, y: 30 }
        },
        'Cut Cats Courier',
        '3521 N. Lincoln Ave.',
        'Chicago, IL 60618',
        '(773) 749-9084',
        'accounting@cutcatscourier.com',
        {
          text: title,
          bold: true,
          margin: [0, 20, 0, 10]
        },
        // Totals table
        {
          layout: 'headerLineOnly',
          table: {
            headerRows: 2,
            widths: [200, '*'],
            body: [
              [
                { text: ['Tip Total', { text: tipTotalReason ? ` (${tipTotalReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: currency(tipTotal), alignment: 'right' }
              ],
              [
                { text: ['Fee Total', { text: feeTotalReason ? ` (${feeTotalReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: currency(feeTotal), alignment: 'right' }
              ],
              ['Delivery Total', { text: currency(this.getDeliveryFeeTotal()), alignment: 'right' }]
            ]
          }
        },
        {
          layout: 'headerLineOnly',
          margin: [0, 0, 0, 20],
          table: {
            headerRows: 1,
            widths: [200, '*'],
            body: [
              [
                { text: ['Admin Fee', { text: adminFeeReason ? ` (${adminFeeReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: currency(adminFee), alignment: 'right' }
              ],
              [
                { text: 'Total Paystub', bold: true },
                { text: currency(this.getPaystubTotal()), alignment: 'right', bold: true }
              ],
            ]
          }
        },
        `Rides this period: ${this.getNumRidesInPeriod()}`,
        `Rides this month: ${this.getNumRidesInMonth()}`,
        // Ride breakdown table
        {
          layout: 'headerLineOnly',
          margin: [0, 10, 0, 0],
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
            body: [
              ['Job ID', 'Date', 'Address', 'Order Amount', 'Fee', 'Tip'].map(text => ({ text, color: 'gray' })),
              ...this.ridesInPeriod
                .sort((ride1, ride2) => (ride1.readyTime - ride2.readyTime))
                .map(ride => (
                  [
                    ride.jobId,
                    moment(ride.readyTime).format('M/D/YYYY h:mma'),
                    ride.destinationAddress1,
                    currency(ride.orderTotal),
                    currency(ride.deliveryFee),
                    currency(ride.tip)
                  ]
                ))
            ],
          }
        }
      ]
    };

    return new Promise((resolve, reject) => {
      this.lambda.invoke({
        FunctionName: process.env.PDF_SERVICE,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(docDefinition)
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
  
function currency(num) {
  return `$${(num || 0).toFixed(2)}`;
}

module.exports = CourierPaystub;
