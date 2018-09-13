import React from 'react';
import PropTypes from 'prop-types';
import DateFilterContainer from '../containers/DateFilterContainer';
import PayrollRow from './PayrollRow';
import styles from './PayrollsTable.module.scss';

export class PayrollsTable extends React.Component {
  constructor (props) {
    super(props);
  }

  renderTable () {
    if (this.props.payrolls.length) {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th className={`${styles.actionsColumn}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.payrolls.map((payroll, index) => (
              payroll._id ? this.renderPayrollRow(payroll) : this.renderPotentialPayrollRow(payroll, index)
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

  renderPayrollRow(payroll) {
    return (
      <PayrollRow
        key={payroll._id}
        periodStart={payroll.periodStart}
        periodEnd={payroll.periodEnd}
        showRunPayroll={false}
        downloadUrl={`/api/payrolls/${payroll._id}/download`}
      />
    );
  }

  renderPotentialPayrollRow(potentialPayroll, index) {
    return (
      <PayrollRow
        key={index}
        periodStart={potentialPayroll.periodStart}
        periodEnd={potentialPayroll.periodEnd}
        showRunPayroll={true}
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

PayrollsTable.propTypes = {
  payrolls: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PayrollsTable;
