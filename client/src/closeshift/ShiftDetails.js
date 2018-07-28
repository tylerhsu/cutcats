import React from 'react';
import PropTypes from 'prop-types';

export default class ShiftDetails extends React.Component {
  constructor (props) {
    super(props);

    this.state = {

    };
  }

  render () {
    return (
      <div>
        <label htmlFor='amDispatcher'>AM Dispatcher</label>
        <select onChange={this.handleChange}>
        </select>
      </div>
    );
  }
}

ShiftDetails.propTypes = {
  couriers: PropTypes.arrayOf(PropTypes.object).isRequired
};
