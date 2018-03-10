import React from 'react';
import requiresAuth from '../global/requiresAuth';
import { hot } from 'react-hot-loader';
import Navbar from '../navbar';
import CouriersTable from './CouriersTable';

export class App extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <React.Fragment>
              <Navbar />
              <CouriersTable />
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));
