import React from 'react';
import requiresAuth from '../global/requiresAuth';
import { hot } from 'react-hot-loader';
import Navbar from '../navbar';
import JobsTable from './JobsTable';
import '../global/global.scss';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

export class App extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <React.Fragment>
              <Navbar />
              <JobsTable />
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));
