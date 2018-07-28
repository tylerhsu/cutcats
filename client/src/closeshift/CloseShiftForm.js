import React from 'react';
import PropTypes from 'prop-types';
import Uploader from './Uploader';
import ShiftDetails from './ShiftDetails';
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
      uploaderError: null
    };

    this.handleValidationSuccess = this.handleValidationSuccess.bind(this);
    this.handleValidationFailure = this.handleValidationFailure.bind(this);
    this.handleUploaderError = this.handleUploaderError.bind(this);
    this.handleShiftDetailsChange = this.handleShiftDetailsChange.bind(this);
    this.submit = this.submit.bind(this);
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
      uploaderError: err.message
    });
  }

  handleShiftDetailsChange (field, value) {
    this.setState({ [field]: value });
  }

  submit (e) {
    e.preventDefault();
  }
  
  render() {
    return (
      <Form>
        <div>
          <h3 style={{ fontWeight: 'bold' }}>1. Import ride data</h3>
          <Uploader
            validationUrl='/api/rides/import?save=false'
            onValidationSuccess={this.handleValidationSuccess}
            onValidationFailure={this.handleValidationFailure}
            onError={this.handleUploaderError}
          />
          {this.state.uploaderValidationErrors && this.state.uploaderValidationErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
          {this.state.uploaderError && (
            <div style="color: red">An unexpected error occurred: {this.state.uploaderError}</div>
          )}
        </div>
        <div style={{ marginTop: '2rem' }}>
          <fieldset disabled={!this.state.importFile} style={{ color: !this.state.importFile ? 'lightgray' : null }}>
            <h3 style={{ fontWeight: 'bold' }}>2. Enter shift details</h3>
            <ShiftDetails
              onChange={this.handleShiftDetailsChange}
              amDispatcher={this.state.amDispatcher}
              pmDispatcher={this.state.pmDispatcher}
              comments={this.state.comments}
            />
            <Button color='primary' type='submit' onClick={this.submit}>Close shift</Button>
          </fieldset>
        </div>
      </Form>
    );
  }
}

CloseShiftForm.propTypes = {
  user: PropTypes.object.isRequired
};
