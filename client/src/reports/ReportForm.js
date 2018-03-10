import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import { DateRangePicker } from 'react-dates';
import { encode, decode, replaceInUrlQuery, addUrlProps, UrlQueryParamTypes } from 'react-url-query';

export class ReportForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            focusedInput: null
        };

        this.onDatesChange = this.onDatesChange.bind(this);
    }

    onDatesChange({ startDate, endDate }) {
        const startStamp = startDate ? startDate.valueOf() : null;
        const endStamp = endDate ? endDate.valueOf() : null;
        this.props.onChangeStartDate(startStamp);
        this.props.onChangeEndDate(endStamp);
    }

    render() {
        return (
            <React.Fragment>
              <div>
                <label htmlFor="startDate">Report interval</label>
              </div>
              <div>
                <DateRangePicker
                    startDate={moment(this.props.startDate)}
                    endDate={moment(this.props.endDate)}
                    startDateId="startDate"
                    endDateId="endDate"
                    onDatesChange={this.onDatesChange}
                    focusedInput={this.state.focusedInput}
                    onFocusChange={focusedInput => this.setState({ focusedInput })}
                    minimumNights={0}
                    numberOfMonths={1}
                    enableOutsideDays={true}
                    isOutsideRange={() => false}
                    showDefaultInputIcon={true}
                />
              </div>
              {this.props.startDate && this.props.endDate && this.renderDownloadLinks()}
            </React.Fragment>
        );
    }

    renderDownloadLinks() {
        const query = qs.stringify({
            from: this.props.startDate,
            to: this.props.endDate
        });
        return (
            <div className="my-4">
              <div>
                <a href={`/api/reports/payroll?${query}`} target="_blank">Download payroll for {this.getDateString()}</a>
              </div>
              <div>
                <a href={`/api/reports/invoice?${query}`} target="_blank">Download invoices for {this.getDateString()}</a>
              </div>
            </div>
        );
    }

    getDateString() {
        const format = 'MMM Do, YYYY';
        const startDateString = moment(this.props.startDate).format(format);
        const endDateString = moment(this.props.endDate).format(format);
        if (startDateString === endDateString) {
            return startDateString
        } else {
            return `${startDateString} through ${endDateString}`;
        }
    }
}

ReportForm.propTypes = {
    startDate: PropTypes.number,
    endDate: PropTypes.number,
    onChangeStartDate: PropTypes.func,
    onChangeEndDate: PropTypes.func
};

ReportForm.defaultProps = {
    startDate: new Date().valueOf(),
    endDate: new Date().valueOf()
};

function mapUrlToProps(url, ownProps) {
    return {
        startDate: decode(UrlQueryParamTypes.number, url.startDate),
        endDate: decode(UrlQueryParamTypes.number, url.endDate)
    }
}

function mapUrlChangeHandlersToProps(ownProps) {
    return {
        onChangeStartDate: (timestamp) => {
            replaceInUrlQuery('startDate', encode(UrlQueryParamTypes.number, timestamp));
        },
        onChangeEndDate: (timestamp) => {
            replaceInUrlQuery('endDate', encode(UrlQueryParamTypes.number, timestamp))
        }
    }
}

export default addUrlProps({ mapUrlToProps, mapUrlChangeHandlersToProps })(ReportForm);
