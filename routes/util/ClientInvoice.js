const moment = require('moment');
const _ = require('lodash');

class ClientInvoice {
  constructor(client, rides, fromDate, toDate, monthRideCount) {
    this.client = client;
    this.rides = rides;
    this.fromDate = fromDate,
    this.toDate = toDate;
    this.monthRideCount = monthRideCount;
    this.isMonthEnd = moment(toDate).date() === moment(toDate).endOf('month').date();
  }

  getClientName() {
    return this.client.name;
  }

  getDateRange() {
    return `${moment(this.fromDate).format('MMM Do, YYYY')} - ${moment(this.toDate).format('MMM Do, YYYY')}`;
  }

  getTotalRidesInPeriod() {
    return this.rides.length;
  }

  getTotalRidesInMonth() {
    return this.monthRideCount;
  }

  getAdminFee() {
    if (!this.isMonthEnd) {
      return 0;
    } else if (this.client.adminFeeType === 'fixed') {
      return this.client.fixedAdminFee;
    } else if (this.client.adminFeeType === 'scale') {
      if (this.monthRideCount < 30) {
        return 50;
      } else if (this.monthRideCount < 90) {
        return 75;
      } else if (this.monthRideCount < 210) {
        return 100;
      } else {
        return 125;
      }
    } else {
      throw new Error(`Don't know how to calculate admin fee for client with admin fee type "${this.adminFeeType}"`);
    }
  }

  getTipTotal () {
    return _.sumBy(this.rides, ride => ride.tip || 0);
  }

  getFeeTotal () {
    return _.sumBy(this.rides, ride => ride.deliveryFee || 0);
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
