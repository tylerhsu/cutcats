import React from 'react';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import CouriersTable from './CouriersTable';
import '../global/global.css';
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
              <CouriersTable />
            </React.Fragment>
        );
    }
}

export default requiresAuth(App);
