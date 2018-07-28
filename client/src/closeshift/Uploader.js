import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

export default class Uploader extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange (e) {
    if (!e.target.files.length) {
      return;
    }
    
    const file = e.target.files[0];
    const data = new FormData();
    data.append('file', file);
    
    axios.post(this.props.validationUrl, data)
      .then(() => {
        return this.props.onValidationSuccess(file);
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
          const errorMessages = (err.response.data || '').split('\n');
          return this.props.onValidationFailure(errorMessages, file);
        } else {
          return this.props.onError(err.response.data || err.message);
        }
      });
  }
  
  render() {
    return (
      <div>
        <input type="file" accept=".csv" onChange={this.handleChange} />
      </div>
    );
  }
}

Uploader.propTypes = {
  validationUrl: PropTypes.string.isRequired,
  onValidationSuccess: PropTypes.func.isRequired,
  onValidationFailure: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};
