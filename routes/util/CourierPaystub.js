const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const logoBase64 = fs.readFileSync(path.resolve(__dirname, './pdf-logo.png')).toString('base64');
const explainable = require('./explainable');
const AccountingPeriod = require('./AccountingPeriod');

class CourierPaystub extends AccountingPeriod {
  constructor(courier, ridesInMonth, periodStart, periodEnd, lambda) {
    super(ridesInMonth, periodStart, periodEnd, lambda);
    this.ridesInMonth.forEach(ride => {
      if (!(ride.client && ride.client.paymentType)) {
        throw new Error(`Ride ${ride._id} has prevented paystub generation because its client's payment type could not be determined`);
      }
    });
    this.courier = courier;
    this.getTipTotal = explainable(this.getTipTotal.bind(this));
    this.getFeeTotal = explainable(this.getFeeTotal.bind(this));
    this.getDeliveryFeeTotal = explainable(this.getDeliveryFeeTotal.bind(this));
  }

  getCourierName() {
    return this.courier.name;
  }

  getTipsCollectedByRider () {
    return _.chain(this.ridesInPeriod)
      .filter(ride => ride.client.paymentType === 'paid')
      .sumBy(this.ridesInPeriod, ride => ride.tip || 0)
      .value();
  }

  getTipsOwedToRider () {
    return _.chain(this.ridesInPeriod)
      .filter(ride => ride.client.paymentType === 'invoiced')
      .sumBy(this.ridesInPeriod, ride => ride.tip || 0)
      .value();
  }

  getTipTotal() {
    return _.sumBy(this.ridesInPeriod, ride => ride.tip || 0);
  }

  getFeesCollectedByRider () {
    return _.chain(this.ridesInPeriod)
      .filter(ride => ride.client.paymentType === 'paid')
      .sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0)
      .value();
  }

  getFeesOwedToRider () {
    return _.chain(this.ridesInPeriod)
      .filter(ride => ride.client.paymentType === 'invoiced')
      .sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0)
      .value();
  }

  getFeeTotal() {
    return _.sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0);
  }

  getDeliveryFeeCollectedByRider() {
    return this.getTipsCollectedByRider() + this.getFeesCollectedByRider();
  }

  getDeliveryFeeOwedToRider() {
    return this.getTipsOwedToRider() + this.getFeesOwedToRider();
  }

  getDeliveryFeeTotal() {
    return [
      this.getTipTotal() + this.getFeeTotal(),
      'Tips + fees'
    ];
  }

  getPaystubTotal () {
    return 1;
  }

  getPdfDocDefinition () {
    const title = `${this.courier.name} Paystub, ${this.getDateRange()}`;
    const { value: adminFee, reason: adminFeeReason } = this.getAdminFee({ explain: true });
    const { value: tipTotal, reason: tipTotalReason } = this.getTipTotal({ explain: true });
    const { value: feeTotal, reason: feeTotalReason } = this.getFeeTotal({ explain: true });
    return {
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
  }
}
  
function currency(num) {
  return `$${(num || 0).toFixed(2)}`;
}

module.exports = CourierPaystub;
