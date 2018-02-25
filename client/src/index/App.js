import React from 'react';
import requiresAuth from '../global/requiresAuth';

export class App extends React.Component {
    constructor(props) {
        super(props);

        window.location.replace('/couriers');
    }

    render() {
        return null;
    }
}

export default requiresAuth(App);
