import React from 'react';
import Uploader from './Uploader';
import ShiftDetails from './ShiftDetails';

export default class CloseShiftForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      importFile: null,
      uploaderValidationErrors: null,
      uploaderError: null
    };

    this.handleValidationSuccess = this.handleValidationSuccess.bind(this);
    this.handleValidationFailure = this.handleValidationFailure.bind(this);
    this.handleUploaderError = this.handleUploaderError.bind(this);
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

  submit () {

  }
  
  render() {
    return (
      <div>
        <div>
          <h1>1. Import ride data</h1>
          <Uploader
            validationUrl='/api/rides/import?save=false'
            onValidationSuccess={this.handleValidationSuccess}
            onValidationFailure={this.handleValidationFailure}
            onError={this.handleUploaderError}
          />
        </div>
        <div>
          <fieldset disabled={!this.state.importFile} style={{ color: !this.state.importFile ? 'lightgray' : null }}>
            <h1>2. Enter shift details</h1>
            <ShiftDetails />
            <button onClick={this.submit}>Close shift</button>
          </fieldset>
        </div>
      </div>
    );
  }
}
