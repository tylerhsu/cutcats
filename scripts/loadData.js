require('dotenv').config();

const mongoose = require('mongoose');
const _ = require('underscore');
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
        console.log(err);
        process.exit(1);
    });

function getCouriers() {
    const couriersCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/couriers.csv'), {
        columns: true
    });

    return couriersCsv.map(row => {
        return {
            name: row['Rider Name'],
            radioCallNumber: row['Radio Call Number'],
            phone: row['Phone Number'],
            email: row['Rider E-mail'],
            status: mapCourierStatus(row['status']),
            startDate: row['Timestamp'] === 'moonlighter' ? undefined : row['Timestamp']
        };
    });
}

function mapCourierStatus(csvStatus) {
    switch (csvStatus) {
        case 'Non-Partner Rider Payouts': return 'guest';
        case 'Guaranteed Pay to Partners': return 'member';
        default: return;
    }
}

function getClients() {
    const clientsCsv = parseCsv(fs.readFileSync(__dirname + '/../misc/clients.csv'), {
        columns: true
    });
    
    return clientsCsv.map(row => {
        return {
            name: row['Client Name'],
            paymentType: row['invoiced'],
            address: row['Address'],
            phone: row['Restaurant Phone'],
            email: row['Email'],
            fixedAdminFee: parseInt(row['Admin Fee']) ? row['Admin Fee'] : undefined,
            billingEmail: row['Billing Email'],
        };
    });
}
