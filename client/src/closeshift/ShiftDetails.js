import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

export default class ShiftDetails extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      couriers: []
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount () {
    if (!(this.state.couriers && this.state.couriers.length)) {
      axios.get('/api/couriers')
        .then(res => {
          this.setState({ couriers: res.data });
        });
    }
  }

  handleChange (e) {
    const field = e.target.name;
    const value = e.target.value;
    this.props.onChange(field, value);
  }

  render () {
    if (!(this.state.couriers && this.state.couriers.length)) {
      return null;
    } else {
      return (
        <div>
          <label htmlFor='amDispatcher'>AM Dispatcher</label>
          <select name='amDispatcher' onChange={this.handleChange} value={this.state.amDispatcher}>
            {this.state.couriers.map(courier => (
              <option key={courier._id} value={courier._id}>{courier.name}</option>
            ))}
          </select>
        </div>
      );
    }
  }
}

ShiftDetails.propTypes = {
  onChange: PropTypes.func.isRequired,
  amDispatcher: PropTypes.string,
  pmDispatcher: PropTypes.string,
  comments: PropTypes.string
};
