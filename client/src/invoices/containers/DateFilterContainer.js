import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { DateRangePicker } from 'react-dates';
import { connect } from 'react-redux';
import { fetchInvoices } from '../reducers/invoices';

export class DateFilterContainer extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      focusedInput: null
    };

    this.onDatesChange = this.onDatesChange.bind(this);
  }

  onDatesChange ({ startDate, endDate }) {
    this.props.fetchInvoices(startDate, endDate);
  }

  render () {
    return (
      <DateRangePicker
        startDate={moment(this.props.fromDate)}
        endDate={moment(this.props.toDate)}
        startDateId="fromDate"
        endDateId="toDate"
        onDatesChange={this.onDatesChange}
        focusedInput={this.state.focusedInput}
        onFocusChange={focusedInput => this.setState({ focusedInput })}
        minimumNights={0}
        isOutsideRange={() => false}
        showDefaultInputIcon={true}
      />
    );
  }
}

DateFilterContainer.propTypes = {
  fromDate: PropTypes.number.isRequired,
  toDate: PropTypes.number.isRequired,
  fetchInvoices: PropTypes.func.isRequired
};


function mapStateToProps(state) {
  return {
    fromDate: state.invoices.fromDate,
    toDate: state.invoices.toDate
  };
}

const mapDispatchToProps = {
  fetchInvoices
};

export default connect(mapStateToProps, mapDispatchToProps)(DateFilterContainer);
