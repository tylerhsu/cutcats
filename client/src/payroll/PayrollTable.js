import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import axios from 'axios';
import { precisionRound } from '../global/misc';
import { DateRangePicker } from 'react-dates';
import { encode, decode, replaceInUrlQuery, addUrlProps, UrlQueryParamTypes } from 'react-url-query';

export class PayrollTable extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      payrollRows: [],
      focusedInput: null
    };

    this.onDatesChange = this.onDatesChange.bind(this);
  }

  onDatesChange ({ startDate, endDate }) {
    const startStamp = startDate ? startDate.valueOf() : null;
    const endStamp = endDate ? endDate.valueOf() : null;
    this.props.onChangeStartDate(startStamp);
    this.props.onChangeEndDate(endStamp);
    this.fetchPayroll();
  }

  fetchPayroll () {
    let url = '/api/payroll';

    let params = {
      from: this.props.startDate,
      to: this.props.endDate
    };

    return axios.get(url, { params })
      .then(res => {
        this.setState({ payrollRows: res.data });
      });
  }

  componentDidMount () {
    return this.fetchPayroll();
  }

  renderTable () {
    if (this.state.payrollRows.length) {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Courier</th>
              <th>Rides completed</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {this.state.payrollRows.map(payrollRow => (
              <tr key={payrollRow._id.courier._id}>
                <td>{payrollRow._id.courier.name}</td>
                <td>{payrollRow.rideCount}</td>
                <td>${precisionRound(payrollRow.balance, 2).toFixed(2)}</td>
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
            <DateRangePicker
              startDate={moment(this.props.startDate)}
              endDate={moment(this.props.endDate)}
              startDateId="startDate"
              endDateId="endDate"
              onDatesChange={this.onDatesChange}
              focusedInput={this.state.focusedInput}
              onFocusChange={focusedInput => this.setState({ focusedInput })}
              minimumNights={0}
              isOutsideRange={() => false}
              showDefaultInputIcon={true}
            />
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

PayrollTable.propTypes = {
  startDate: PropTypes.number,
  endDate: PropTypes.number,
  onChangeStartDate: PropTypes.func,
  onChangeEndDate: PropTypes.func
};

PayrollTable.defaultProps = {
  startDate: new Date().valueOf(),
  endDate: new Date().valueOf()
};

function mapUrlToProps (url) {
  return {
    startDate: decode(UrlQueryParamTypes.number, url.startDate),
    endDate: decode(UrlQueryParamTypes.number, url.endDate)
  };
}

function mapUrlChangeHandlersToProps () {
  return {
    onChangeStartDate: (timestamp) => {
      replaceInUrlQuery('startDate', encode(UrlQueryParamTypes.number, timestamp));
    },
    onChangeEndDate: (timestamp) => {
      replaceInUrlQuery('endDate', encode(UrlQueryParamTypes.number, timestamp));
    }
  };
}

export default addUrlProps({ mapUrlToProps, mapUrlChangeHandlersToProps })(PayrollTable);
