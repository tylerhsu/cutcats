import React from 'react';
import requiresAuth from '../global/requiresAuth';
import { hot } from 'react-hot-loader';

export class App extends React.Component {
    constructor(props) {
        super(props);

        window.location.replace('/welcome');
    }

    render() {
        return null;
    }
}

export default hot(module)(requiresAuth(App));
