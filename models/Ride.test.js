import 'should';
import { hydrateClient, hydrateCourier } from './Ride';
import Client from './Client';
import Courier from './Courier';
import { fixtureModel } from './fixtures';
import { idsShouldBeEqual } from '../routes/util/testUtils';

describe('Ride', function() {
  describe('hydrateClient()', function() {
    it('returns the client matching the given name', function() {
      const clientName = 'client 1';
      const client = fixtureModel('Client', { name: clientName });
      return client.save()
        .then(() => {
          return hydrateClient(clientName);
        })
        .then(result => {
          result.should.be.an.instanceOf(Client);
          result.name.should.eql(clientName);
          idsShouldBeEqual(result, client);
        });
    });

    it('returns the client fuzzy matching the given name', function() {
      const clientName = 'client 1';
      const clients = [
        fixtureModel('Client', { name: clientName }),
        fixtureModel('Client', { name: 'foo' }),
        fixtureModel('Client', { name: 'bar' }),
      ];
      return Client.ensureIndexes()
        .then(() => {
          return clients.map(client => client.save());
        })
        .then(() => {
          return hydrateClient('client');
        })
        .then(result => {
          result.should.be.an.instanceOf(Client);
          result.name.should.eql(clientName);
          idsShouldBeEqual(result, clients[0]);
        });
    });

    it('uses the cache if one is provided', function() {
      const clientName = 'client 1';
      const cache = {};
      const client = fixtureModel('Client', { name: clientName });

      return client.save()
        .then(() => {
          return hydrateClient(clientName, {}, cache);
        })
        .then(result => {
          result.name.should.eql(clientName);
          return client.remove();
        })
        .then(() => {
          return hydrateClient(clientName, {}, cache);
        })
        .then(result => {
          result.name.should.eql(clientName);
        });
    });
  });

  describe('hydrateCourier()', () => {
    it('returns the courier matching the given call number', function() {
      const courierCallNumber = '1';
      const courier = fixtureModel('Courier', { radioCallNumber: courierCallNumber });
      const csvRow = {
        'courier number': courierCallNumber,
      };
      return courier.save()
        .then(() => {
          return hydrateCourier(courier.name, csvRow);
        })
        .then(result => {
          result.should.be.an.instanceOf(Courier);
          result.radioCallNumber.should.eql(parseInt(courierCallNumber));
          idsShouldBeEqual(result, courier);
        });
    });

    it('uses the cache if one is provided', function() {
      const courierCallNumber = '1';
      const cache = {};
      const courier = fixtureModel('Courier', { radioCallNumber: courierCallNumber });
      const csvRow = {
        'courier number': courierCallNumber,
      };

      return courier.save()
        .then(() => {
          return hydrateCourier(courier.name, csvRow, cache);
        })
        .then(result => {
          result.radioCallNumber.should.eql(parseInt(courierCallNumber));
          return courier.remove();
        })
        .then(() => {
          return hydrateCourier(courier.name, csvRow, cache);
        })
        .then(result => {
          result.radioCallNumber.should.eql(parseInt(courierCallNumber));
        });
    });
  });
});
