import React from 'react';
import PropTypes from 'prop-types';
import DateFilterContainer from '../containers/DateFilterContainer';

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
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {this.props.invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.periodStart} - {invoice.periodEnd}</td>
                <td>{invoice.filePath}</td>
              </tr>
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
