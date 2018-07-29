import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  FormGroup,
  Label,
  Input
} from 'reactstrap';

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
          <FormGroup>
            <Label for='amDispatcher'>AM Dispatcher</Label>
            <Input type='select' name='amDispatcher' onChange={this.handleChange} value={this.props.amDispatcher} style={{ width: '15rem' }} required>
              <option value=''>Select a dispatcher</option>
              {this.state.couriers.map(courier => (
                <option key={courier._id} value={courier._id}>{courier.name}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for='pmDispatcher'>PM Dispatcher</Label>
            <Input type='select' name='pmDispatcher' onChange={this.handleChange} value={this.props.pmDispatcher} style={{ width: '15rem' }} required>
              <option value=''>Select a dispatcher</option>
              {this.state.couriers.map(courier => (
                <option key={courier._id} value={courier._id}>{courier.name}</option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for='comments'>Comments</Label>
            <Input type='textarea' name='comments' onChange={this.handleChange} value={this.props.comments} required />
          </FormGroup>
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
