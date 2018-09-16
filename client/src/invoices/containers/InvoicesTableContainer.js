import React from 'react';
import PropTypes from 'prop-types';
import InvoicesTable from '../components/InvoicesTable';
import { connect } from 'react-redux';
import { fetchInvoices } from '../reducers/invoices';
import { getErrorMessage } from '../../global/misc';

export class InvoicesTableContainer extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
    return this.props.fetchInvoices(this.props.fromDate, this.props.toDate);
  }

  render () {
    if (this.props.loading === null) {
      return null;
    } else {
      return (
        <InvoicesTable
          invoices={this.props.invoices}
          error={this.props.error}
        />
      );
    }
  }
}

InvoicesTableContainer.propTypes = {
  fetchInvoices: PropTypes.func.isRequired,
  fromDate: PropTypes.number,
  toDate: PropTypes.number,
  invoices: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string
};

function mapStateToProps(state) {
  const invoices = state.invoices.error ?
    [] :
    state.invoices.payload;
  const potentialInvoices = state.invoices.error ?
    [] :
    state.invoices.potentialInvoices;
  const error = state.invoices.error ?
    getErrorMessage(state.invoices.payload) :
    null;
  return {
    invoices: invoices.concat(potentialInvoices).sort((a, b) => {
      return new Date(b.periodStart) - new Date(a.periodStart);
    }),
    fromDate: state.invoices.fromDate,
    toDate: state.invoices.toDate,
    loading: state.invoices.loading,
    error
  };
}

const mapDispatchToProps = {
  fetchInvoices
};

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesTableContainer);
