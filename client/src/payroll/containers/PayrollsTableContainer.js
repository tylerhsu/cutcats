import React from 'react';
import PropTypes from 'prop-types';
import PayrollsTable from '../components/PayrollsTable';
import { connect } from 'react-redux';
import { fetchPayrolls } from '../reducers/payrolls';
import { getErrorMessage } from '../../global/misc';

export class PayrollsTableContainer extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
    return this.props.fetchPayrolls(this.props.fromDate, this.props.toDate);
  }

  render () {
    if (this.props.loading === null) {
      return null;
    } else {
      return (
        <PayrollsTable
          payrolls={this.props.payrolls}
          error={this.props.error}
        />
      );
    }
  }
}

PayrollsTableContainer.propTypes = {
  fetchPayrolls: PropTypes.func.isRequired,
  fromDate: PropTypes.number,
  toDate: PropTypes.number,
  payrolls: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string
};

function mapStateToProps(state) {
  const payrolls = state.payrolls.error ?
    [] :
    state.payrolls.payload;
  const potentialPayrolls = state.payrolls.error ?
    [] :
    state.payrolls.potentialPayrolls;
  const error = state.payrolls.error ?
    getErrorMessage(state.payrolls.payload) :
    null;
  return {
    payrolls: payrolls.concat(potentialPayrolls).sort((a, b) => {
      return new Date(b.periodStart) - new Date(a.periodStart);
    }),
    fromDate: state.payrolls.fromDate,
    toDate: state.payrolls.toDate,
    loading: state.payrolls.loading,
    error
  };
}

const mapDispatchToProps = {
  fetchPayrolls
};

export default connect(mapStateToProps, mapDispatchToProps)(PayrollsTableContainer);
