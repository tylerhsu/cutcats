import React from 'react';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import { hot } from 'react-hot-loader';
import '../global/global.scss';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

export class App extends React.Component {
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
                this.setState({
                    status: 'error',
                    errors: 'Something unexpected went wrong: ' + err.message
                });
            });
    }
    
    render() {
        const errors = (this.state.errors || '').split('\n').map((error, index) => {
            return (
                <div key={index} className="py-1">{error}</div>
            );
        });
        return (
            <React.Fragment>
              <Navbar />
              <div className="container">
                <div className="row">
                  <div className="col">
                    <div>Import a csv from TwinJet</div>
                    <input type="file" accept=".csv" onChange={this.handleFileChange} />
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <div>{this.state.status}</div>
                    {this.state.status === 'success' &&
                        <div>
                          <a href="/jobs">See all jobs</a>
                        </div>
                    }
                    {errors.length &&
                        <div>{errors}</div>
                    }
                  </div>
                </div>
              </div>
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));

