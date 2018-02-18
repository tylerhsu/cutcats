require('dotenv').config();

const mongoose = require('mongoose');
const _ = require('underscore');
const models = require('../models');
const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');

mongoose.connect(process.env.MONGODB_URI);

Promise.all([
    models.Zone.remove(),
    models.Courier.remove(),
    models.Client.remove()
])
    .then(() => {
        const zones = getZones()
            .map(zone => {
                return { name: zone };
            });
        
        return models.Zone.insertMany(zones);
    })
    .then(zones => {
        const couriers = getCouriers();
        const clients = getClients(zones);
        return Promise.all([
            models.Courier.insertMany(couriers),
            models.Client.insertMany(clients)
        ]);
    })
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });

function getZones() {
    const clientsCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/clients.csv'), {
        columns: true
    });

    return _.chain(clientsCsv)
        .pluck('Zone')
        .uniq()
        .compact()
        .value();
}

function getCouriers() {
    const couriersCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/couriers.csv'), {
        columns: true
    });

    return couriersCsv.map(row => {
        return {
            name: row['Rider Name'],
            qbName: row['QB Name'],
            radioCallNumber: row['Radio Call Number'],
            radioFee: row['Radio Fee'],
            phone: row['Phone Number'],
            email: row['Rider E-mail'],
            depositPaid: (row['deposit paid?'] || '').toLowerCase() === 'yes',
            status: row['status'],
            active: row['Active / Inactive'] === 'Active',
            taxWithholding: row['tax withholding']
        };
    });
}

function getClients(zones) {
    const clientsCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/clients.csv'), {
        columns: true
    });
    
    return clientsCsv.map(row => {
        return {
            name: row['Client Name'],
            qbName: row['qb name'],
            paymentType: row['invoiced'],
            rep: row['rep'],
            company: row['Company'],
            address: row['Address'],
            phone: row['Restaurant Phone'],
            email: row['Email'],
            zone: zones.find(zone => (zone.name === row['Zone'])),
            fixedAdminFee: parseInt(row['Admin Fee']) ? row['Admin Fee'] : undefined,
            billingEmail: row['Billing Email'],
            hours: row['Hours']
        };
    });
}
