import React from 'react';
import PropTypes from 'prop-types';
import Uploader from './Uploader';
import axios from 'axios';
import {
  Button,
  Form
} from 'reactstrap';
import { getErrorMessage } from '../global/misc';

export default class CloseShiftForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: null,
      errorMessage: '',
      loading: false,
      success: false
    };

    this.handleValidationBegin = this.handleValidationBegin.bind(this);
    this.handleValidationSuccess = this.handleValidationSuccess.bind(this);
    this.handleValidationFailure = this.handleValidationFailure.bind(this);
    this.handleUploaderError = this.handleUploaderError.bind(this);
    this.handleUploaderClear = this.handleUploaderClear.bind(this);
    this.submit = this.submit.bind(this);
  }

  handleValidationBegin (file) {
    this.setState({
      uploaderValidationErrors: null,
      uploaderError: null
    });
  }

  handleValidationSuccess (file) {
    this.setState({
      importFile: file,
      uploaderValidationErrors: null,
      uploaderError: null
    });
  }

  handleValidationFailure (errors) {
    this.setState({
      importFile: null,
      uploaderValidationErrors: errors,
      uploaderError: null
    });
  }

  handleUploaderError (err) {
    this.setState({
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: err.message || err || 'An unexpected error occurred'
    });
  }

  handleUploaderClear () {
    this.setState({
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: null
    });
  }

  submit (e) {
    e.preventDefault();
    this.setState({
      loading: true,
      uploaderValidationErrors: null,
      uploaderError: null
    });
    const data = new FormData();
    data.append('file', this.state.importFile);
    return axios.post('/api/rides/import?save=true', data)
      .then(() => {
        this.setState({ success: true });
      })
      .catch(err => {
        this.setState({
          success: false,
          errorMessage: getErrorMessage(err)
        });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }
  
  render() {
    if (this.state.success) {
      return this.renderSuccess();
    } else {
      return (
        <Form>
          <h3 style={{ fontWeight: 'bold' }} className='my-0'>
            Import rides
          </h3>
          <Uploader
            file={this.state.importFile}
            validationUrl='/api/rides/import?save=false'
            onValidationBegin={this.handleValidationBegin}
            onValidationSuccess={this.handleValidationSuccess}
            onValidationFailure={this.handleValidationFailure}
            onError={this.handleUploaderError}
            onClear={this.handleUploaderClear}
            showClear={!this.state.loading}
          />
          {(this.state.uploaderValidationErrors && this.state.uploaderValidationErrors.length) && (
            <div className='mt-4'>
              {this.state.uploaderValidationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          {this.state.uploaderError && (
            <div className='mt-4' style={{ color: 'red' }}>There was a problem while attempting to validate the file: {this.state.uploaderError}</div>
          )}
          {!!this.state.importFile && (
            <Button color={this.state.importFile ? 'primary' : 'secondary'} type='submit' onClick={this.submit} disabled={this.state.loading} style={{ width: '8rem' }} className='mt-4'>
              {this.state.loading ? (
                <em>Importing...</em>
              ) : (
                'Import rides'
              )}
            </Button>
          )}
          {this.state.errorMessage && (
            <div className='text-danger'>{this.state.errorMessage}</div>
          )}
        </Form>
      );
    }
  }

  renderSuccess () {
    return (
      <div className='text-center'>
        <div className='mt-6' style={{ fontSize: '5rem' }}>
          <i className='fa fa-check-circle text-success' />
        </div>
        <h3>Rides imported</h3>
        <div>
          <a href='/rides'>View rides</a>
        </div>
      </div>
    );
  }
}

CloseShiftForm.propTypes = {
  user: PropTypes.object.isRequired
};
