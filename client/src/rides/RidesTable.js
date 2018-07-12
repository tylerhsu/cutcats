import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import fetch from 'cross-fetch';
import moment from 'moment';

const RESULTS_PER_PAGE = 100;

export default class RidesTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            rides: [],
            freetext: '',
            loading: true,
            page: 1
        };

        this.handleFreetextChange = this.handleFreetextChange.bind(this);
    }

    fetchRides() {
        let url = '/api/rides',
            query = {
                populate: 'client courier',
                sort: '-updatedAt',
                page: this.state.page,
                resultsPerPage: RESULTS_PER_PAGE
            };

        if (this.state.freetext) {
            query.q = this.state.freetext;
        }

        this.setState({ loading: true });
        
        return Promise.all([
            fetch([url, qs.stringify(query)].join('?'), { credentials: 'include' }),
            fetch([url, qs.stringify({ ...query, count: true })].join('?'), { credentials: 'include' })
        ])
            .then(responses => {
                return Promise.all([
                    responses[0].json(),
                    responses[1].json()
                ]);
            })
            .then(data => {
                this.setState({
                    rides: data[0],
                    count: data[1].count
                });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    }

    componentWillMount() {
        return this.fetchRides()
    }

    handleFreetextChange(e) {
        this.setState({
            freetext: e.target.value
        }, () => {
            this.fetchRides();
        });
    }

    renderTable() {
        if (this.state.loading) {
            return (
                <div>
                  <i className='fa fa-spin fa-spinner' />
                </div>
            );
        } else if (this.state.rides.length) {
            const rides = this.state.rides.map(ride => {
                return (
                    <tr key={ride._id}>
                      <td>{ride.jobId}</td>
                      <td>{ride.client ? ride.client.name : 'None'}</td>
                      <td>{ride.courier ? ride.courier.name : 'None'}</td>
                      <td>{ride.originAddress}</td>
                      <td>{ride.destinationAddress1}</td>
                      <td>{moment(ride.createdAt).format('MM/DD/YYYY')}</td>
                    </tr>
                );
            });

            return (
                <React.Fragment>
                  <div className='mb-4'>Showing {this.state.count > RESULTS_PER_PAGE ? `first ${RESULTS_PER_PAGE} of ` : ''}{this.state.count} ride{this.state.count === 1 ? '' : 's'}</div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Client</th>
                        <th>Courier</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Imported on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rides}
                    </tbody>
                  </table>
                </React.Fragment>
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
                    <input id="freetext" className="form-control" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by ride id" />
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
