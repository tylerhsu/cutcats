const moment = require('moment');
const _ = require('lodash');
const pdf = require('./pdf');

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
    const getScaledFee = () => {
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
    };
    
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
      return [
        getScaledFee(),
        `Scaled fee for ${this.getNumRidesInMonth()} rides`
      ];
    } else {
      throw new Error(`Don't know how to calculate admin fee for client with admin fee type "${this.adminFeeType}"`);
    }
  }

  getTipTotal () {
    return _.sumBy(this.ridesInPeriod, ride => ride.tip || 0);
  }

  getFeeTotal () {
    return _.sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0);
  }

  getDeliveryFeeTotal() {
    switch (this.client.paymentType) {
    case 'invoiced': return this.getTipTotal() + this.getFeeTotal();
    case 'paid': return [0, 'This is a paid client'];
    default: throw new Error(`Don't know how to calculate delivery fee total for client with payment type "${this.client.paymentType}"`);
    }
  }

  getInvoiceTotal () {
    return this.getAdminFee() + this.getDeliveryFeeTotal();
  }

  renderPdf () {
    const title = `${this.client.name} Invoice, ${this.getDateRange()}`;
    const { value: adminFeeAmount, reason: adminFeeReason } = this.getAdminFee({ explain: true });
    const { value: deliveryFeeTotalAmount, reason: deliveryFeeTotalReason } = this.getDeliveryFeeTotal({ explain: true });
    const docDefinition = {
      info: {
        title,
        author: 'Cut Cats'
      },
      content: [
        // Title
        {
          text: title,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        // Totals table
        {
          margin: [0, 0, 0, 10],
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', '*', '*', '*', '*'],
            body: [
              ['Total Rides This Period', 'Total Rides This Month', 'Admin Fee', 'Tip Total', 'Fee Total', 'Delivery Fee Total', 'Total Invoice'].map(text => ({ text, color: 'gray' })),
              [
                this.getNumRidesInPeriod(),
                this.getNumRidesInMonth(),
                [
                  currency(adminFeeAmount),
                  adminFeeReason ? { text: adminFeeReason, color: 'gray', fontSize: 8 } : null
                ],
                currency(this.getTipTotal()),
                currency(this.getFeeTotal()),
                [
                  currency(deliveryFeeTotalAmount),
                  deliveryFeeTotalReason ? { text: deliveryFeeTotalReason, color: 'gray', fontSize: 8 } : null
                ],
                currency(this.getInvoiceTotal())
              ]
            ],
          }
        },
        // Ride breakdown table
        {
          layout: 'headerLineOnly',
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
