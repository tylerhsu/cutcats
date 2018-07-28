import React from 'react';
import requiresAuth from '../global/requiresAuth';
import Navbar from '../navbar';
import CloseShiftForm from './CloseShiftForm';
import { hot } from 'react-hot-loader';

export class App extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <React.Fragment>
        <Navbar />
        <div className="container">
          <CloseShiftForm />
        </div>
      </React.Fragment>
    );
  }
}

export default hot(module)(requiresAuth(App));
