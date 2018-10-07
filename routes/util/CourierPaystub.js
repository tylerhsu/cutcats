const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const logoBase64 = fs.readFileSync(path.resolve(__dirname, './pdf-logo.png')).toString('base64');
const explainable = require('./explainable');
const AccountingPeriod = require('./AccountingPeriod');

class CourierPaystub extends AccountingPeriod {
  constructor(courier, rides, periodStart, periodEnd, lambda) {
    super(rides, periodStart, periodEnd, lambda);
    this.rides.forEach(ride => {
      if (!(ride.client && ride.client.paymentType)) {
        throw new Error(`Ride ${ride._id} has prevented paystub generation because its client's payment type could not be determined`);
      }
    });
    this.courier = courier;
    this.paidRidesInPeriod = this.ridesInPeriod.filter(ride => ride.client.paymentType === 'paid');
    this.invoicedRidesInPeriod = this.ridesInPeriod.filter(ride => ride.client.paymentType === 'invoiced');
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

  getCourierCallNumber() {
    return this.courier.radioCallNumber;
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
      `Delivery fees from ${rides.length} rides`
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
      `Delivery fees from ${this.paidRidesInPeriod.length} paid rides`
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
        Math.floor(ride.deliveryFee * .25),
        ['*', '25% of fee rounded down (on-demand or catering food ride)']
      ];
    case 'cargo/wholesale/commissary':
      return [
        Math.floor(ride.deliveryFee * .12),
        ['†', '12% of fee rounded down (cargo/wholesale/commissary ride)']
      ];
    default:
      throw new Error(`Don't know how to calculate toCC for a ride whose client's delivery fee structure is "${ride.client.deliveryFeeStructure}"`);
    }
  }

  getToCCTotal() {
    return _.sumBy(this.ridesInPeriod, ride => this.getToCC(ride));
  }

  getRadioFee() {
    if (this.courier.monthlyRadioRental) {
      return 20;
    } else {
      return 0;
    }
  }

  getPaystubTotal () {
    return this.getDeliveryFeeOwedToRider() - this.getToCCTotal() - this.getRadioFee();
  }

  getPdfDocDefinition () {
    const title = `${this.courier.name}, ${this.getDateRange()}`;
    const tipTotal = this.getTipTotal();
    const feeTotal = this.getFeeTotal();
    const deliveryFeeTotal = this.getDeliveryFeeTotal();
    const { value: deliveryFeeCollectedByRider, reason: deliveryFeeCollectedByRiderReason } = this.getDeliveryFeeCollectedByRider({ explain: true });
    const deliveryFeeOwedToRider = this.getDeliveryFeeOwedToRider();
    const { value: radioFee, reason: radioFeeReason } = this.getRadioFee({ explain: true });
    const toCCTotal = this.getToCCTotal();
    const paystubTotal = this.getPaystubTotal();
    const toCCReasons = {};
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
                { text: 'Tip Total' },
                { text: currency(tipTotal), alignment: 'right' }
              ],
              [
                { text: 'Fee Total' },
                { text: currency(feeTotal), alignment: 'right' }
              ],
              ['Delivery Total', { text: currency(deliveryFeeTotal), alignment: 'right' }]
            ]
          }
        },
        {
          layout: 'headerLineOnly',
          table: {
            headerRows: 1,
            widths: [200, '*'],
            body: [
              [
                { text: ['Already Collected By Rider', { text: deliveryFeeCollectedByRiderReason ? ` (${deliveryFeeCollectedByRiderReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: `(${currency(deliveryFeeCollectedByRider)})`, alignment: 'right' }
              ],
              [
                { text: 'Owed To Rider' },
                { text: currency(deliveryFeeOwedToRider), alignment: 'right' }
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
                { text: `(${currency(toCCTotal)})`, alignment: 'right' }
              ],
              [
                { text: ['Radio Fee', { text: radioFeeReason ? ` (${radioFeeReason.toLowerCase()})` : '', color: 'gray' }] },
                { text: `(${currency(radioFee)})`, alignment: 'right' }
              ],
              [
                { text: 'Total Rider Payout', bold: true },
                { text: currency(paystubTotal), alignment: 'right', bold: true }
              ],
            ]
          }
        },
        `Rides this period: ${this.getNumRidesInPeriod()}`,
        // Ride breakdown table
        {
          layout: 'headerLineOnly',
          margin: [0, 10, 0, 0],
          fontSize: 10,
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Job ID', 'Date', 'Client', 'Address', 'Order Amount', 'Fee', 'Tip', 'To CC', 'Payment Type'].map(text => ({ text, color: 'gray' })),
              ...this.ridesInPeriod
                .sort((ride1, ride2) => (ride1.readyTime - ride2.readyTime))
                .map(ride => {
                  const { value: toCC, reason: toCCReason } = this.getToCC(ride, { explain: true });
                  toCCReasons[toCCReason[0]] = toCCReason[1];
                  return [
                    ride.jobId,
                    moment(ride.readyTime).format('M/D/YYYY h:mma'),
                    ride.client.name,
                    ride.destinationAddress1,
                    currency(ride.orderTotal),
                    currency(ride.deliveryFee),
                    currency(ride.tip),
                    {
                      columns: [
                        `${currency(toCC)}`,
                        { text: toCCReason[0], fontSize: 8 }
                      ]
                    },
                    ride.client.paymentType
                  ];
                })
            ],
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: _.toPairs(toCCReasons).map(reason => ({
            text: `${reason[0]}: ${reason[1]}\n`,
            fontSize: 8
          }))
        }
      ]
    };
  }
}
  
function currency(num) {
  return `$${(num || 0).toFixed(2)}`;
}

module.exports = CourierPaystub;
