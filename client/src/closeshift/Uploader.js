import * as _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import DropZone from 'react-dropzone';
import filesize from 'file-size';
import { Button } from 'reactstrap';

export default class Uploader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false
    };

    this.handleDrop = this.handleDrop.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  handleDrop (acceptedFiles) {
    if (!acceptedFiles.length) {
      return;
    }
    
    const file = acceptedFiles[0];
    const data = new FormData();
    data.append('file', file);

    this.setState({ loading: true });
    this.props.onValidationBegin();
    
    axios.post(this.props.validationUrl, data)
      .then(() => {
        return this.props.onValidationSuccess(file);
      })
      .catch(err => {
        const status = _.get(err, 'response.status');
        if (status === 400) {
          const errorMessages = (err.response.data || '').split('\n');
          return this.props.onValidationFailure(errorMessages, file);
        } else if (status === 503) {
          return this.props.onError('The server took too long to respond. This may have been because the import file is too large. Try splitting the import into two separate halves.');
        } else {
          return this.props.onError(err.response.data || err.message || err);
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleClear () {
    this.props.onClear();
  }
  
  render () {
    return (
      <div>
        {!this.props.file && (
          <DropZone
            multiple={false}
            style={{ height: '8rem', border: '2px dashed lightgray', cursor: 'pointer' }}
            className='d-flex w-100 mt-4 justify-content-center align-items-center'
            activeClassName='bg-light'
            onDrop={this.handleDrop}
            disabled={!!this.state.loading}
          >
            <div className='text-secondary' style={{ fontSize: '1.5rem' }}>
              {this.state.loading ? (
                <span>Validating...</span>
              ) : (
                <span>Drag TwinJet file here or click to browse</span>
              )}
            </div>
          </DropZone>
        )}
        {!!this.props.file && (
          <div>
            <div className='d-flex align-items-center mt-4'>
              <i className='fa fa-file' style={{ fontSize: '2rem' }} />
              <div className='ml-2'>
                <div>{this.props.file.name}</div>
                <div className='text-secondary' style={{ fontSize: '.8rem' }}>{filesize(this.props.file.size).human('si')}</div>
              </div>
            </div>
            {!!this.props.showClear && (
              <Button color='link' className='mt-2 p-0 text-secondary' onClick={this.handleClear}>
                Choose a different file
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
}

Uploader.propTypes = {
  file: PropTypes.object,
  validationUrl: PropTypes.string.isRequired,
  onValidationBegin: PropTypes.func.isRequired,
  onValidationSuccess: PropTypes.func.isRequired,
  onValidationFailure: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  showClear: PropTypes.bool.isRequired,
};
