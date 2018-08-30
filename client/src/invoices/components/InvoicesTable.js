import React from 'react';
import PropTypes from 'prop-types';
import DateFilterContainer from '../containers/DateFilterContainer';
import InvoiceRow from './InvoiceRow';

export class InvoicesTable extends React.Component {
  constructor (props) {
    super(props);
  }

  renderTable () {
    if (this.props.invoices.length) {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.invoices.map((invoice, index) => (
              invoice._id ? this.renderInvoiceRow(invoice) : this.renderPotentialInvoiceRow(invoice, index)
            ))}
          </tbody>
        </table>
      );
    } else {
      return (
        <div>No results</div>
      );
    }
  }

  renderInvoiceRow(invoice) {
    return (
      <InvoiceRow
        key={invoice._id}
        periodStart={invoice.periodStart}
        periodEnd={invoice.periodEnd}
        showRunInvoicing={false}
        downloadUrl={`/api/invoices/${invoice._id}/download`}
      />
    );
  }

  renderPotentialInvoiceRow(potentialInvoice, index) {
    return (
      <InvoiceRow
        key={index}
        periodStart={potentialInvoice.periodStart}
        periodEnd={potentialInvoice.periodEnd}
        showRunInvoicing={true}
      />
    );
  }

  render () {
    return (
      <React.Fragment>
        <div className="row mb-4">
          <div className="col-lg-4">
            <label htmlFor="startDate">Date range</label>
            <DateFilterContainer />
          </div>
        </div>
        <div className="row">
          <div className="col">
            { this.renderTable() }
          </div>
        </div>
      </React.Fragment>
    );
  }
}

InvoicesTable.propTypes = {
  invoices: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default InvoicesTable;
