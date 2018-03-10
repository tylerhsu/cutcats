import React from 'react';
import { hot } from 'react-hot-loader';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import ReportForm from './ReportForm';
import history from './history';

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
                <div className="row">
                  <div className="col">
                    <ReportForm />
                  </div>
                </div>
              </div>
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));

