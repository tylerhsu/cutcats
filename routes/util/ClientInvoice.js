const moment = require('moment');
const _ = require('lodash');
const pdf = require('./pdf');
const path = require('path');

class ClientInvoice {
  constructor(client, ridesInMonth, periodStart, periodEnd) {
    this.client = client;
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
  }

  getClientName() {
    return this.client.name;
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
    if (!this.isMonthEnd) {
      return [
        0,
        'This is a mid-month invoice'
      ];
    } else if (this.client.adminFeeType === 'fixed') {
      return [
        this.client.fixedAdminFee,
        'Fixed fee'
      ];
    } else if (this.client.adminFeeType === 'scale') {
      const numRidesInMonth = this.getNumRidesInMonth();
      if (numRidesInMonth < 30) {
        return 50;
      } else if (numRidesInMonth < 90) {
        return 75;
      } else if (numRidesInMonth < 210) {
        return 100;
      } else {
        return 125;
      }
    } else {
      throw new Error(`Don't know how to calculate admin fee for client with admin fee type "${this.adminFeeType}"`);
    }
  }

  getTipTotal () {
    switch (this.client.paymentType) {
    case 'invoiced': return _.sumBy(this.ridesInPeriod, ride => ride.tip || 0);
    case 'paid': return [0, 'This is a paid client'];
    default: throw new Error(`Don't know how to calculate tip total for client with payment type "${this.client.paymentType}"`);
    }
  }

  getFeeTotal () {
    switch (this.client.paymentType) {
    case 'invoiced': return _.sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0);
    case 'paid': return [0, 'This is a paid client'];
    default: throw new Error(`Don't know how to calculate tip total for client with payment type "${this.client.paymentType}"`);
    }
  }

  getDeliveryFeeTotal() {
    return [
      this.getTipTotal() + this.getFeeTotal(),
      'Tips + fees'
    ];
  }

  getInvoiceTotal () {
    return this.getAdminFee() + this.getDeliveryFeeTotal();
  }

  renderPdf () {
    const title = `${this.client.name} Invoice, ${this.getDateRange()}`;
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
          image: path.resolve(__dirname, './pdf/logo.png'),
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
                { text: 'Total Invoice', bold: true },
                { text: currency(this.getInvoiceTotal()), alignment: 'right', bold: true }
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
              ...this.ridesInPeriod.map(ride => (
                [
                  ride.jobId,
                  moment(ride.readyTime).format('M/D/YYYY h:ma'),
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
    const doc = pdf.createPdf(docDefinition);
    doc.end();
    return doc;
  }
}

function currency(num) {
  return `$${(num || 0).toFixed(2)}`;
}

/*
   Let the given function optionally return a two-element array whose first element
   is the original return value and whose second is a string annotation explaining the return value.

   Returns a version of that function that may accept an { explain: true } option as the last argument.
   If options.explain is false, the function's original behavior is unaltered.  If options.explain is true,
   the function returns an object { value, reason }.
 */
function explainable(func) {
  return (...args) => {
    const lastArg = args[args.length - 1];
    const explain = typeof(lastArg) === 'object' && lastArg.explain;
    const result = func(...args);
    const [value, reason] = Array.isArray(result) ? result : [result, ''];
    return explain ? { value, reason } : value;
  };
}

module.exports = ClientInvoice;
