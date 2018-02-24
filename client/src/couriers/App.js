import React from 'react';
import CouriersTable from './CouriersTable';

export default class App extends React.Component {
    componentWillMount() {
        fetch('/api/me')
            .then(res => {
                console.log(res);
            });
    }
    
    render() {
        return (
            <CouriersTable />
        );
    }
}
