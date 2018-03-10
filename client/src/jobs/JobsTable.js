import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import fetch from 'cross-fetch';

export default class JobsTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            jobs: [],
            freetext: ''
        };

        this.handleFreetextChange = this.handleFreetextChange.bind(this);
    }

    fetchJobs() {
        let url = '/api/jobs',
            query = { populate: 'client courier', sort: '-updatedAt' };

        if (this.state.freetext) {
            query.q = this.state.freetext;
        }
        
        return fetch([url, qs.stringify(query)].join('?'), { credentials: 'include' })
            .then(res => {
                return res.json();
            })
            .then(jobs => {
                this.setState({ jobs });
            });
    }

    componentWillMount() {
        return this.fetchJobs()
    }

    handleFreetextChange(e) {
        this.setState({
            freetext: e.target.value
        }, () => {
            this.fetchJobs();
        });
    }

    renderTable() {
        if (this.state.jobs.length) {
            const jobs = this.state.jobs.map(job => {
                return (
                    <tr key={job._id}>
                      <td>{job.jobId}</td>
                      <td>{job.client.name}</td>
                      <td>{job.courier.name}</td>
                      <td>{job.originAddress}</td>
                      <td>{job.destinationAddress1}</td>
                      <td>{job.createdAt}</td>
                    </tr>
                );
            });

            return (
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
                    {jobs}
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
                    <input id="freetext" className="form-control" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by job id" />
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
