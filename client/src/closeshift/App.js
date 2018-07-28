import React from 'react';
import PropTypes from 'prop-types';
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
          <div className="col-md-8 mx-auto">
            <CloseShiftForm user={this.props.user} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

App.propTypes = {
  user: PropTypes.object
};

export default hot(module)(requiresAuth(App));
