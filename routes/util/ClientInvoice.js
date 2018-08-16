const moment = require('moment');
const _ = require('lodash');

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
      return 0;
    } else if (this.client.adminFeeType === 'fixed') {
      return this.client.fixedAdminFee;
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
    return _.sumBy(this.ridesInPeriod, ride => ride.tip || 0);
  }

  getFeeTotal () {
    return _.sumBy(this.ridesInPeriod, ride => ride.deliveryFee || 0);
  }

  getDeliveryFeeTotal() {
    switch (this.client.paymentType) {
    case 'invoiced': return this.getTipTotal() + this.getFeeTotal();
    case 'paid': return 0;
    default: throw new Error(`Don't know how to calculate delivery fee total for client with payment type "${this.client.paymentType}"`);
    }
  }

  getInvoiceTotal () {
    return this.getAdminFee() + this.getDeliveryFeeTotal();
  }
}

module.exports = ClientInvoice;
