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
    this.paidRidesInPeriod = this.ridesInPeriod.filter(ride => ride.paymentType === 'paid');
    this.invoicedRidesInPeriod = this.ridesInPeriod.filter(ride => ride.paymentType === 'invoiced');
    // totals
    this.getTipTotal = explainable(this.getTipTotal.bind(this));
    this.getFeeTotal = explainable(this.getFeeTotal.bind(this));
    this.getDeliveryFeeTotal = explainable(this.getDeliveryFeeTotal.bind(this));
    // collected by rider
    this.getTipsCollectedByRider = explainable(this.getTipsCollectedByRider.bind(this));
    this.getFeesCollectedByRider = explainable(this.getFeesCollectedByRider.bind(this));
    this.getDeliveryFeeCollectedByRider = explainable(this.getDeliveryFeeCollectedByRider.bind(this));
    // owed to rider
    this.getTipsOwedToRider = explainable(this.getTipsOwedToRider.bind(this));
    this.getFeesOwedToRider = explainable(this.getFeesOwedToRider.bind(this));
    this.getDeliveryFeeOwedToRider = explainable(this.getDeliveryFeeOwedToRider.bind(this));
    
    this.getToCC = explainable(this.getToCC.bind(this));
    this.getToCCTotal = explainable(this.getToCCTotal.bind(this));
    this.getRadioFee = explainable(this.getRadioFee.bind(this));
  }

  getCourierName() {
    return this.courier.name;
  }

  getTipTotal(rides) {
    rides = rides || this.ridesInPeriod;
    return [
      _.sumBy(rides, ride => ride.tip || 0),
      `Tips from ${rides.length} rides`
    ];
  }

  getFeeTotal(rides) {
    rides = rides || this.ridesInPeriod;
    return [
      _.sumBy(rides, ride => ride.deliveryFee || 0),
      `Delivery fees from ${rides} rides`
    ];
  }

  getDeliveryFeeTotal() {
    return [
      this.getTipTotal() + this.getFeeTotal(),
      'Tips + fees'
    ];
  }

  getTipsCollectedByRider () {
    return [
      this.getTipTotal(this.paidRidesInPeriod),
      `Tips from ${this.paidRidesInPeriod.length} paid rides`
    ];
  }

  getFeesCollectedByRider () {
    return [
      this.getFeeTotal(this.paidRidesInPeriod),
      `Delivery fees from ${this.paidRidesInPeriod} paid rides`
    ];
  }

  getDeliveryFeeCollectedByRider () {
    return [
      this.getTipsCollectedByRider() + this.getFeesCollectedByRider(),
      'Tips + fees from paid rides'
    ];
  }

  getTipsOwedToRider () {
    return this.getTipTotal() - this.getTipsCollectedByRider();
  }

  getFeesOwedToRider () {
    return this.getFeeTotal() - this.getFeesCollectedByRider();
  }

  getDeliveryFeeOwedToRider() {
    return this.getTipsOwedToRider() + this.getFeesOwedToRider();
  }

  getToCC(ride) {
    switch(ride.client.deliveryFeeStructure) {
    case 'on demand food':
      // falls through
    case 'legacy on demand food':
      // falls through
    case 'catering food':
      return [
        Math.floor(ride.fee * .25),
        `25% of $${currency(ride.fee)} fee rounded down`
      ];
    case 'cargo/wholesale/commissary':
      return [
        Math.floor(ride.fee * .12),
        `12% of $${currency(ride.fee)} fee rounded down`
      ];
    default:
      throw new Error(`Don't know how to calculate toCC for a ride whose client's delivery fee structure is "${ride.client.deliveryFeeStructure}"`);
    }
  }

  getToCCTotal() {
    return _.sumBy(this.ridesInPeriod, ride => this.getToCC(ride));
  }

  getRadioFee() {
    if (this.courier.monthlyRadioRental && this.isMonthEnd) {
      return 20;
    } else {
      return [0, this.courier.monthlyRadioRental ? 'No radio fee on mid-month paystub' : ''];
    }
  }

  getPaystubTotal () {
    return this.getDeliveryFeeOwedToRider() - this.getToCCTotal() - this.getRadioFee();
  }

  getPdfDocDefinition () {
    const title = `${this.courier.name} Paystub, ${this.getDateRange()}`;
    const { value: tipTotal, reason: tipTotalReason } = this.getTipTotal({ explain: true });
    const { value: feeTotal, reason: feeTotalReason } = this.getFeeTotal({ explain: true });
    const { value: deliveryFeeCollectedByRider, reason: deliveryFeeCollectedByRiderReason } = this.getDeliveryFeeCollectedByRider({ explain: true });
    const { value: radioFee, reason: radioFeeReason } = this.getRadioFee({ explain: true });
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
                { text: ['Delivery Total Collected By Rider', { text: deliveryFeeCollectedByRiderReason ? ` (${deliveryFeeCollectedByRiderReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: `(${currency(deliveryFeeCollectedByRider)})`, alignment: 'right' }
              ],
              [
                { text: 'Delivery Total Owed To Rider', bold: true },
                { text: currency(this.getDeliveryFeeOwedToRider()), alignment: 'right', bold: true }
              ],
            ]
          }
        },
        {
          layout: 'headerLineOnly',
          margin: [0, 0, 0, 20],
          table: {
            headerRows: 2,
            widths: [200, '*'],
            body: [
              [
                { text: 'To Cut Cats' },
                { text: `(${currency(this.getToCCTotal())})`, alignment: 'right' }
              ],
              [
                { text: ['Radio Fee', { text: radioFeeReason ? ` (${radioFeeReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: `(${currency(radioFee)})`, alignment: 'right' }
              ],
              [
                { text: 'Total Rider Payout', bold: true },
                { text: currency(this.getPaystubTotal()), alignment: 'right', bold: true }
              ],
            ]
          }
        },
        `Rides this period: ${this.getNumRidesInPeriod()}`,
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
