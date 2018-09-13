import React from 'react';
import PropTypes from 'prop-types';
import PayrollsTable from '../components/PayrollsTable';
import { connect } from 'react-redux';
import { fetchPayrolls } from '../reducers/payrolls';

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
        />
      );
    }
  }
}

PayrollsTableContainer.propTypes = {
  fetchPayrolls: PropTypes.func.isRequired,
  fromDate: PropTypes.number.isRequired,
  toDate: PropTypes.number.isRequired,
  payrolls: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool
};

function mapStateToProps(state) {
  const payrolls = state.payrolls.payload;
  const potentialPayrolls = state.payrolls.potentialPayrolls;
  return {
    payrolls: payrolls.concat(potentialPayrolls).sort((a, b) => {
      return new Date(b.periodStart) - new Date(a.periodStart);
    }),
    fromDate: state.payrolls.fromDate,
    toDate: state.payrolls.toDate,
    loading: state.payrolls.loading
  };
}

const mapDispatchToProps = {
  fetchPayrolls
};

export default connect(mapStateToProps, mapDispatchToProps)(PayrollsTableContainer);
