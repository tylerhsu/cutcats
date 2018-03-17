import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs'

export default class Uploader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            status: 'ready',
            errors: null
        };

        this.handleFileChange = this.handleFileChange.bind(this);
    }

    handleFileChange(e) {
        let data = new FormData();
        data.append('file', e.target.files[0]);
        let reqOptions = { credentials: 'include', body: data, method: 'post' };

        if (!e.target.files.length) {
            return;
        }
        
        this.setState({
            status: 'validating',
            errors: null
        });
        
        fetch('/api/jobs/import?save=false', reqOptions)
            .then(res => {
                if (res.ok) {
                    this.setState({ status: 'importing' });
                    return fetch('/api/jobs/import?save=true', reqOptions);
                } else {
                    return res;
                }
            })
            .then(res => {
                if (res.ok) {
                    this.setState({ status: 'success' });
                } else {
                    return res.text()
                        .then(text => {
                            this.setState({
                                status: 'error',
                                errors: text
                            });
                        });
                }
            })
            .catch(err => {
                console.error(err);
                this.setState({
                    status: 'error',
                    errors: 'Something unexpected went wrong: ' + err.message
                });
            });
    }
    
    render() {
        return (
            <div>
              <div>Import a csv from TwinJet</div>
              <input type="file" accept=".csv" onChange={this.handleFileChange} />
              <div>{this.state.status}</div>
              {this.state.status === 'success' && this.renderSuccess() }
              {this.state.errors && this.state.errors.length && this.renderErrors() }
            </div>
        );
    }

    renderSuccess() {
        const today = new Date().valueOf();
        const query = qs.stringify({
            from: today,
            to: today
        });
        
        return (
            <div>
              <div>
                <a href={`/api/payroll/csv?${query}`} target="_blank">Download today's payroll</a>
              </div>
              <div>
                <a href={`/api/invoices/csv?${query}`} target="_blank">Download today's invoices</a>
              </div>
              <div>
                <a href="/quickexport">Download reports for a different time period</a>
              </div>
            </div>
        );
    }

    renderErrors() {
        const errors = (this.state.errors || '').split('\n').map((error, index) => {
            return (
                <div key={index} className="py-1">{error}</div>
            );
        });

        return (
            <div>{errors}</div>
        );
    }
}
