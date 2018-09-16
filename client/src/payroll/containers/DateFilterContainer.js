import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import qs from 'querystring';
import { DateRangePicker } from 'react-dates';
import { connect } from 'react-redux';
import { fetchPayrolls } from '../reducers/payrolls';

export class DateFilterContainer extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      focusedInput: null
    };

    this.onDatesChange = this.onDatesChange.bind(this);
  }

  onDatesChange ({ startDate, endDate }) {
    let query = qs.parse(window.location.search.replace('?', ''));
    query.startDate = new Date(startDate).valueOf();
    query.endDate = new Date(endDate).valueOf();
    window.history.replaceState({}, '', `${window.location.pathname}?${qs.stringify(query)}`);
    this.props.fetchPayrolls(startDate, endDate);
  }

  render () {
    return (
      <DateRangePicker
        startDate={this.props.fromDate ? moment(this.props.fromDate) : null}
        endDate={this.props.toDate ? moment(this.props.toDate) : null}
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
  fromDate: PropTypes.number,
  toDate: PropTypes.number,
  fetchPayrolls: PropTypes.func.isRequired
};


function mapStateToProps(state) {
  return {
    fromDate: state.payrolls.fromDate,
    toDate: state.payrolls.toDate
  };
}

const mapDispatchToProps = {
  fetchPayrolls
};

export default connect(mapStateToProps, mapDispatchToProps)(DateFilterContainer);
