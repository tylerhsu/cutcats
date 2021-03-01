const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const logoBase64 = fs.readFileSync(path.resolve(__dirname, './pdf-logo.png')).toString('base64');
const explainable = require('./explainable');
const AccountingPeriod = require('./AccountingPeriod');

class ClientInvoice extends AccountingPeriod {
  constructor(client, ridesInMonth, periodStart, periodEnd, lambda) {
    super(ridesInMonth, periodStart, periodEnd, lambda);
    this.client = client;
    this.ridesInMonth = this.rides;
    this.getAdminFee = explainable(this.getAdminFee.bind(this));
    this.getTipTotal = explainable(this.getTipTotal.bind(this));
    this.getFeeTotal = explainable(this.getFeeTotal.bind(this));
    this.getDeliveryFeeTotal = explainable(this.getDeliveryFeeTotal.bind(this));
    this.getSalesTotal = explainable(this.getSalesTotal.bind(this));
    this.getSalesSubtotal = explainable(this.getSalesSubtotal.bind(this));
  }

  getClientName() {
    return this.client.name;
  }

  getNumRidesInMonth() {
    return this.ridesInMonth.length;
  }

  getAdminFee() {
    if (this.client.adminFeeType !== 'percentage' && !this.isMonthEnd) {
      return [
        0,
        'No admin fee on mid-month invoice'
      ];
    } else if (this.client.adminFeeType === 'percentage') {
      return [
        this.getSalesSubtotal() * (this.client.percentageAdminFee / 100),
        `${this.client.percentageAdminFee}% of this period's sales without tips, fees, or ${this.getSalesTaxRate() * 100}% sales tax`,
      ];
    } else if (this.client.adminFeeType === 'fixed') {
      return [
        this.client.fixedAdminFee,
        'Fixed fee'
      ];
    } else if (this.client.adminFeeType === 'scale') {
      const numRidesInMonth = this.getNumRidesInMonth();
      const getScaledFee = () => {
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
      return [
        getScaledFee(),
        `${numRidesInMonth} ride${numRidesInMonth === 1 ? '' : 's'} this month`
      ];
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
    default: throw new Error(`Don't know how to calculate fee total for client with payment type "${this.client.paymentType}"`);
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

  getSalesSubtotal() {
    return [
      this.getSalesTotal() / (1 + this.getSalesTaxRate()),
      `Sales total before ${this.getSalesTaxRate() * 100}% sales tax`,
    ];
  }

  getSalesTotal() {
    return [
      _.sumBy(this.ridesInPeriod, ride => ride.billableTotal || 0),
      'Sum of order amounts minus tips and fees',
    ];
  }

  getSalesTaxRate() {
    return this.client.isSubjectToDowntownSalesTax ? 0.1175 : 0.1075;
  }

  getPdfDocDefinition () {
    const title = `${this.client.name} Invoice, ${this.getDateRange()}`;
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

module.exports = ClientInvoice;
