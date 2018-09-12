import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';
import moment from 'moment';
import { Button } from 'reactstrap';
import classnames from 'classnames';
import { runInvoicing } from '../reducers/invoices';
import fileDownload from 'js-file-download';
import { getErrorMessage } from '../../global/misc';

export class InvoiceRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dryRunLoading: false,
      runInvoicingLoading: false,
      error: ''
    };

    this.handleRunInvoicing = this.handleRunInvoicing.bind(this);
    this.handleDryRun = this.handleDryRun.bind(this);
  }

  handleRunInvoicing() {
    this.setState({
      runInvoicingLoading: true,
      error: ''
    });
    this.props.runInvoicing(this.props.periodStart, this.props.periodEnd)
      .catch(err => {
        this.setState({
          error: getErrorMessage(err),
          runInvoicingLoading: false
        });
      });
  }

  handleDryRun(e) {
    e.preventDefault();
    const periodStartStamp = new Date(this.props.periodStart).valueOf();
    const periodEndStamp = new Date(this.props.periodEnd).valueOf();
    this.setState({
      dryRunLoading: true,
      error: ''
    });
    // this url works fine as an ordinary link. The only reason it's an xhr is so we can show a spinner.
    axios.get(`/api/invoices/generate?periodStart=${periodStartStamp}&periodEnd=${periodEndStamp}`, {
      responseType: 'arraybuffer'
    })
      .then(res => {
        const filename = res.headers['content-disposition'].split('=')[1] || 'invoices.zip';
        fileDownload(res.data, filename);
      })
      .catch(err => {
        this.setState({ error: getErrorMessage(err) });
      })
      .finally(() => {
        this.setState({ dryRunLoading: false });
      });
  }
  
  render() {
    const periodStartStamp = new Date(this.props.periodStart).valueOf();
    const periodEndStamp = new Date(this.props.periodEnd).valueOf();
    const isInFuture = Date.now() < periodStartStamp;
    const isInPast = Date.now() > periodEndStamp;
    const isInProgress = !isInFuture && !isInPast;
    return (
      <tr>
        <td className={classnames({ 'text-secondary': isInFuture })}>
          <div>{moment(this.props.periodStart).format('MMM Do, YYYY')} - {moment(this.props.periodEnd).format('MMM Do, YYYY')}</div>
          {isInProgress && (
            <div className='text-secondary' style={{ fontSize: '.8rem' }}>Current period</div>
          )}
        </td>
        <td>
          {this.props.downloadUrl && (
            <a href={this.props.downloadUrl}>Download Invoices</a>
          )}
          {this.state.runInvoicingLoading && (
            <em className='text-secondary'>Running invoicing...</em>
          )}
          {this.props.showRunInvoicing && !this.state.runInvoicingLoading && (
            <React.Fragment>
              {isInFuture ? (
                <em className='text-secondary'>This period has not yet begun</em>
              ) : (
                <React.Fragment>
                  <Button color={isInPast ? 'primary' : 'secondary'} onClick={this.handleRunInvoicing} disabled={!isInPast} title={!isInPast ? 'This period is still in progress' : ''}>
                      Run invoicing
                  </Button>
                  <span className='mx-4'>
                    {this.state.dryRunLoading ? (
                      <em className='text-secondary'>Dry running...</em>
                    ) : (
                      <Button color='link' style={{padding: 0}} onClick={this.handleDryRun}>Dry run</Button>
                    )}
                  </span>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          {this.state.error && (
            <div className='text-danger mt-2'>{this.state.error}</div>
          )}
        </td>
      </tr>
    );
  }
}

InvoiceRow.propTypes = {
  periodStart: PropTypes.any.isRequired,
  periodEnd: PropTypes.any.isRequired,
  runInvoicing: PropTypes.func.isRequired,
  downloadUrl: PropTypes.string,
  showRunInvoicing: PropTypes.bool
};

const mapStateToProps = () => ({});

const mapDispatchToProps = {
  runInvoicing
};

export default connect(mapStateToProps, mapDispatchToProps)(InvoiceRow);
