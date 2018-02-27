import React from 'react';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import '../global/global.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

export class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            csvPreview: null
        };

        this.handleFileChange = this.handleFileChange.bind(this);
    }

    handleFileChange(e) {
        let data = new FormData();
        data.append('file', e.target.files[0]);
        fetch('/api/jobs/import', { credentials: 'include', body: data, method: 'post' })
            .then(res => {
                return res.text();
            })
            .then(text => {
                this.setState({ csvPreview: text });
            });
    }
    
    render() {
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
                  {this.state.csvPreview}
                </div>
              </div>
            </React.Fragment>
        );
    }
}

export default requiresAuth(App);

