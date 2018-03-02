import React from 'react';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import { hot } from 'react-hot-loader';
import '../global/global.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

export class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            errors: []
        };

        this.handleFileChange = this.handleFileChange.bind(this);
    }

    handleFileChange(e) {
        let data = new FormData();
        data.append('file', e.target.files[0]);
        fetch('/api/jobs/importpreview', { credentials: 'include', body: data, method: 'post' })
            .then(res => {
                return res.text();
            })
            .then(text => {
                this.setState({ errors: text.split('\n') });
            });
    }
    
    render() {
        const errors = this.state.errors.map(error => {
            return (
                <div>{error}</div>
            );
        });
        return (
            <React.Fragment>
              <Navbar />
              <div className="container">
                <div className="row">
                  <div className="col">
                    <input type="file" name="asdf" accept=".csv" onChange={this.handleFileChange} />
                  </div>
                </div>
                <div className="row">
                  {errors}
                </div>
              </div>
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));

