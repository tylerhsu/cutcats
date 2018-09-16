import React from 'react';
import axios from 'axios';
import moment from 'moment';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker } from 'react-dates';
import qs from 'querystring';
import {
  Button,
  Label,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  InputGroupAddon
} from 'reactstrap';
import { getErrorMessage } from '../global/misc';

const RESULTS_PER_PAGE = 100;

export default class RidesTable extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      rides: [],
      freetext: '',
      fromDate: new Date(),
      toDate: new Date(),
      loading: true,
      page: 1,
      error: null
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.handleDatesChange = this.handleDatesChange.bind(this);
  }

  getFetchParams() {
    let params = {
      populate: 'client courier',
      sort: '-updatedAt',
      page: this.state.page,
      resultsPerPage: RESULTS_PER_PAGE
    };

    if (this.state.freetext) {
      params.q = this.state.freetext;
    }

    if (this.state.fromDate) {
      params.from = moment(this.state.fromDate).startOf('day').valueOf();
    }

    if (this.state.toDate) {
      params.to = moment(this.state.toDate).endOf('day').valueOf();
    }

    return params;
  }

  fetchRides () {
    let url = '/api/rides';
    let params = this.getFetchParams();

    this.setState({ loading: true });

    return Promise.all([
      axios.get(url, { params }),
      axios.get(url, { params: { ...params, count: true } })
    ])
      .then(responses => {
        this.setState({
          rides: responses[0].data,
          count: responses[1].data.count
        });
      })
      .catch(err => {
        this.setState({ error: getErrorMessage(err) });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  componentDidMount () {
    return this.fetchRides();
  }

  handleFreetextChange (e) {
    this.setState({
      freetext: e.target.value
    }, () => {
      this.fetchRides();
    });
  }

  handleDatesChange ({ startDate, endDate }) {
    this.setState({
      fromDate: startDate,
      toDate: endDate
    }, () => {
      this.fetchRides();
    });
  }

  renderTable () {
    if (this.state.loading) {
      return (
        <em className='text-secondary'>Loading... </em>
      );
    } else if (this.state.rides.length) {
      const rides = this.state.rides.map(ride => {
        return (
          <tr key={ride._id}>
            <td>{ride.jobId}</td>
            <td>{ride.client ? ride.client.name : 'None'}</td>
            <td>{ride.courier ? ride.courier.name : 'None'}</td>
            <td>{ride.originAddress}</td>
            <td>{ride.destinationAddress1}</td>
            <td>{moment(ride.readyTime).format('MM/DD/YYYY')}</td>
            <td>{moment(ride.createdAt).format('MM/DD/YYYY')}</td>
          </tr>
        );
      });

      return (
        <React.Fragment>
          <div className='mb-4'>Showing {this.state.count > RESULTS_PER_PAGE ? `first ${RESULTS_PER_PAGE} of ` : ''}{this.state.count} ride{this.state.count === 1 ? '' : 's'}</div>
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Client</th>
                <th>Courier</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Ready time</th>
                <th>Imported on</th>
              </tr>
            </thead>
            <tbody>
              {rides}
            </tbody>
          </table>
        </React.Fragment>
      );
    } else {
      let matching = this.state.freetext ? `matching "${this.state.freetext}"` : '';
      let between = this.state.fromDate && this.state.toDate ? `between ${moment(this.state.fromDate).format('M/D/YYYY')} and ${moment(this.state.toDate).format('M/D/YYYY')}` : '';
      return (
        <div>{`No rides ${matching} ${between}`}</div>
      );
    }
  }

  render () {
    return (
      <div className="container">
        <div className="row mb-4">
          <div className="col-lg-4">
            <FormGroup>
              <Label>Ready time</Label>
              <div>
                <DateRangePicker
                  startDate={this.state.fromDate ? moment(this.state.fromDate) : null}
                  endDate={this.state.toDate ? moment(this.state.toDate) : null}
                  startDateId="fromDate"
                  endDateId="toDate"
                  onDatesChange={this.handleDatesChange}
                  focusedInput={this.state.focusedInput}
                  onFocusChange={focusedInput => this.setState({ focusedInput })}
                  minimumNights={0}
                  isOutsideRange={() => false}
                  showDefaultInputIcon
                  showClearDates
                  small
                />
              </div>
            </FormGroup>
          </div>
          <div className="col-lg-4">
            <FormGroup>
              <Label>Search</Label>
              <InputGroup>
                <InputGroupAddon addonType='prepend'><InputGroupText><i className="fa fa-search" /></InputGroupText></InputGroupAddon>
                <Input id="freetext" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by job ID or origin name" />
              </InputGroup>
            </FormGroup>
          </div>
          <div className="col-lg-4" style={{paddingTop: '2rem'}}>
            <a href={`/api/rides/csv?${qs.stringify(this.getFetchParams())}`} target="_blank" rel="noopener noreferrer">
              <Button color='primary'>
                <i className='fa fa-download' />
                &nbsp;&nbsp;Download CSV
              </Button>
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col">
            {this.state.error ? (
              <div className="text-danger">{this.state.error}</div>
            ) :
              this.renderTable()
            }
          </div>
        </div>
      </div>
    );
  }
}
