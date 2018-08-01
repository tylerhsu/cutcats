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
    return this.props.fetchInvoices({
      from: this.props.fromDate,
      to: this.props.toDate
    });
  }

  render () {
    if (this.props.invoices.loading === null) {
      return null;
    } else {
      return (
        <InvoicesTable
          invoices={this.props.invoices.payload}
        />
      );
    }
  }
}

InvoicesTableContainer.propTypes = {
  fetchInvoices: PropTypes.func.isRequired,
  fromDate: PropTypes.number.isRequired,
  toDate: PropTypes.number.isRequired,
  invoices: PropTypes.object
};

function mapStateToProps(state) {
  return {
    fromDate: state.dateFilter.fromDate,
    toDate: state.dateFilter.toDate,
    invoices: state.invoices
  };
}

const mapDispatchToProps = {
  fetchInvoices
};

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesTableContainer);
