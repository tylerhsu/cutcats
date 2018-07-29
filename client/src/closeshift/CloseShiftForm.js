import React from 'react';
import PropTypes from 'prop-types';
import Uploader from './Uploader';
import ShiftDetails from './ShiftDetails';
import axios from 'axios';
import {
  Button,
  Form
} from 'reactstrap';

export default class CloseShiftForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      importFile: null,
      amDispatcher: '',
      pmDispatcher: this.props.user._id,
      comments: '',
      uploaderValidationErrors: null,
      uploaderError: null,
      errorMessage: '',
      loading: false,
      success: false
    };

    this.handleValidationSuccess = this.handleValidationSuccess.bind(this);
    this.handleValidationFailure = this.handleValidationFailure.bind(this);
    this.handleUploaderError = this.handleUploaderError.bind(this);
    this.handleUploaderClear = this.handleUploaderClear.bind(this);
    this.handleShiftDetailsChange = this.handleShiftDetailsChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  handleValidationSuccess (file) {
    this.setState({
      uploaderLoading: false,
      importFile: file,
      uploaderValidationErrors: null,
      uploaderError: null
    });
  }

  handleValidationFailure (errors) {
    this.setState({
      uploaderLoading: false,
      importFile: null,
      uploaderValidationErrors: errors,
      uploaderError: null
    });
  }

  handleUploaderError (err) {
    this.setState({
      uploaderLoading: false,
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: err.message
    });
  }

  handleUploaderClear () {
    this.setState({
      uploaderLoading: false,
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: null
    });
  }

  handleShiftDetailsChange (field, value) {
    this.setState({ [field]: value });
  }

  submit (e) {
    e.preventDefault();
    this.setState({ loading: true });
    axios.post('/api/shifts', {
      amDispatcher: this.state.amDispatcher,
      pmDispatcher: this.state.pmDispatcher,
      comments: this.state.comments,
      date: new Date()
    })
      .then(res => {
        const data = new FormData();
        data.append('file', this.state.importFile);
        return axios.post(`/api/rides/import?save=true&shiftId=${res.data._id}`, data);
      })
      .then(() => {
        this.setState({ success: true });
      })
      .catch(err => {
        this.setState({
          success: false,
          errorMessage: (err.response && err.response.data) ? err.response.data.message : err.message
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
          <div>
            <h3 style={{ fontWeight: 'bold' }}>
              Ride data
            </h3>
            <Uploader
              file={this.state.importFile}
              validationUrl='/api/rides/import?save=false'
              onValidationSuccess={this.handleValidationSuccess}
              onValidationFailure={this.handleValidationFailure}
              onError={this.handleUploaderError}
              onClear={this.handleUploaderClear}
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
          </div>
          <div style={{ marginTop: '2rem' }}>
            <fieldset disabled={!this.state.importFile} style={{ color: !this.state.importFile ? 'lightgray' : null }}>
              <h3 style={{ fontWeight: 'bold' }}>Shift details</h3>
              <ShiftDetails
                onChange={this.handleShiftDetailsChange}
                amDispatcher={this.state.amDispatcher}
                pmDispatcher={this.state.pmDispatcher}
                comments={this.state.comments}
              />

              <Button color={this.state.importFile ? 'primary' : 'secondary'} type='submit' onClick={this.submit} disabled={this.state.loading} style={{ width: '7rem' }}>
                {this.state.loading ? (
                  <i className='fa fa-spin fa-spinner' />
                ) : (
                  'Close shift'
                )}
              </Button>
              {this.state.errorMessage && (
                <div className='text-danger'>{this.state.errorMessage}</div>
              )}
            </fieldset>
          </div>
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
        <h3>Shift closed</h3>
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
