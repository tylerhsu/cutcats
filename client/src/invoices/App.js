import React from 'react';
import requiresAuth from '../global/requiresAuth';
import { hot } from 'react-hot-loader';
import Navbar from '../navbar';
import InvoicesTable from './InvoicesTable';
import history from '../global/history';

export class App extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        history.listen(() => {
            this.forceUpdate()
        });
    }
    
    render() {
        return (
            <React.Fragment>
              <Navbar />
              <div className="container">
                <div className="row mb-2">
                  <div className="col">
                    <h3>Invoice Report</h3>
                  </div>
                </div>
                <InvoicesTable />
              </div>
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));
