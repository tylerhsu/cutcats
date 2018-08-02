import React from 'react';
import PropTypes from 'prop-types';
import InvoicesTable from '../components/InvoicesTable';
import { connect } from 'react-redux';
import { fetchInvoices } from '../reducers/invoices';

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
          potentialInvoices={this.props.potentialInvoices}
        />
      );
    }
  }
}

InvoicesTableContainer.propTypes = {
  fetchInvoices: PropTypes.func.isRequired,
  fromDate: PropTypes.number.isRequired,
  toDate: PropTypes.number.isRequired,
  invoices: PropTypes.arrayOf(PropTypes.object),
  potentialInvoices: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    fromDate: state.invoices.fromDate,
    toDate: state.invoices.toDate,
    invoices: state.invoices.payload,
    potentialInvoices: state.potentialInvoices.payload,
    loading: state.invoices.loading
  };
}

const mapDispatchToProps = {
  fetchInvoices
};

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesTableContainer);
