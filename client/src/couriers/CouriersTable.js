import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import fetch from 'cross-fetch';

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
        
        return fetch([url, qs.stringify(query)].join('?'), { credentials: 'include' })
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
                      <td>{courier.phone}</td>
                      <td>{courier.email}</td>
                    </tr>
                );
            });

            return (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Call Number</th>
                      <th>Phone</th>
                      <th>Email</th>
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
            <div className="container">
              <div className="row mb-4">
                <div className="col-lg-4">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                    <input id="freetext" className="form-control" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by name or email" />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  { this.renderTable() }
                </div>
              </div>
            </div>
        );
    }
}
