require('dotenv').config();

const models = require('../models');
const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
require('../dbConnection');

Promise.all([
  models.Courier.remove(),
  models.Client.remove()
])
  .then(() => {
    const couriers = getCouriers();
    const clients = getClients();
    return Promise.all([
      models.Courier.insertMany(couriers),
      models.Client.insertMany(clients)
    ]);
  })
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    /* eslint-disable no-console */
    console.log(err);
    process.exit(1);
  });

function getCouriers () {
  const couriersCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/couriers.csv'), {
    columns: true
  });

  return couriersCsv.map((row, n) => {
    return {
      name: row['Rider Name'],
      radioCallNumber: row['Radio Call Number'],
      phone: row['Phone Number'],
      email: row['Rider Email'],
      status: row['Membership'].toLowerCase(),
      startDate: mapStartDate(row['Start Date'], n),
      monthlyRadioRental: mapMonthlyRadioRental(row['Monthly Radio Rental'], n)
    };
  });
}

function mapStartDate (csvValue, n) {
  const date = new Date(csvValue);
  if (csvValue === '#N/A' || csvValue === '') {
    return undefined;
  } else if (isNaN(date.valueOf())) {
    throw new Error(`Could not parse date "${csvValue}" in "Start Date" column on row ${n}`);
  }
  return date;
}

function mapMonthlyRadioRental (csvValue, n) {
  csvValue = csvValue.toLowerCase();
  if (csvValue === 'yes') {
    return true;
  } else if (csvValue === 'no') {
    return false;
  } else {
    throw new Error(`Unrecognized value ${csvValue} in 'Monthly Radio Rental' column on row ${n}`);
  }
}

function getClients () {
  const clientsCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/clients.csv'), {
    columns: true
  });

  return clientsCsv.map(row => {
    return {
      name: row['Client Name'],
      paymentType: row['Payment Type'],
      address: row['Address'],
      phone: row['Phone'],
      email: row['Email'],
      adminFeeType: row['Admin Fee Structure'].toLowerCase() === 'scale' ? 'scale' : 'fixed',
      fixedAdminFee: !isNaN(parseInt(row['Admin Fee Structure'])) ? row['Admin Fee Structure'] : undefined,
      deliveryFeeStructure: row['Delivery Fee Structure'].toLowerCase(),
      billingEmail: row['Billing Email']
    };
  });
}
