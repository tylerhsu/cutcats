import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';

export default class CouriersTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            couriers: [],
            freetext: ''
        };

        this.handleFreetextChange = this.handleFreetextChange.bind(this);
    }

    fetchCouriers() {
        let url = '/api/couriers',
            query = {
                q: this.state.freetext
            };

        if (this.state.freetext) {
            query.q = this.state.freetext;
        }
        
        return fetch([url, qs.stringify(query)].join('?'))
            .then(res => {
                return res.json();
            })
            .then(couriers => {
                this.setState({ couriers });
            });
    }

    componentWillMount() {
        return this.fetchCouriers()
    }

    handleFreetextChange(e) {
        this.setState({
            freetext: e.target.value
        }, () => {
            this.fetchCouriers();
        });
    }

    renderTable() {
        if (this.state.couriers.length) {
            const couriers = this.state.couriers.map(courier => {
                return (
                    <tr key={courier._id}>
                      <td>{courier.name}</td>
                      <td>{courier.radioCallNumber}</td>
                      <td>{courier.radioFee}</td>
                      <td>{courier.phone}</td>
                      <td>{courier.email}</td>
                      <td>{courier.depositPaid}</td>
                      <td>{courier.status}</td>
                      <td>{courier.active}</td>
                      <td>{courier.taxWithholding}</td>
                    </tr>
                );
            });

            return (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Call Number</th>
                      <th>Radio Fee</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Deposit Paid?</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th>Tax Withholding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couriers}
                  </tbody>
                </table>
            );
        } else {
            return (
                <div>No results matching "{this.state.freetext}"</div>
            );
        }
    }

    render() {
        return (
            <div>
              <label htmlFor="freetext">Search by name or email </label>
              <input id="freetext" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} />
              { this.renderTable() }
            </div>
        );
    }
}
