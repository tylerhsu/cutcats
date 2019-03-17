import React from 'react';
import _ from 'lodash';
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
import { getErrorMessage, getUrlQuery, updateUrlQuery } from '../global/misc';
import Paginator from '../global/Paginator';

const RESULTS_PER_PAGE = 100;
const memoizedAxios = _.memoize(axios, config => JSON.stringify(config));

export default class RidesTable extends React.Component {
  constructor (props) {
    super(props);

    const query = getUrlQuery();
    const fromDate = parseInt(query.fromDate);
    const toDate = parseInt(query.toDate);
    const page = parseInt(query.page);
    this.state = {
      rides: [],
      freetext: query.freetext || '',
      fromDate: fromDate ? new Date(fromDate) : new Date(),
      toDate: toDate ? new Date(toDate) : new Date(),
      loading: true,
      page: page || 1,
      error: null
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.handleDatesChange = this.handleDatesChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.debouncedFetchRides = _.debounce(this.fetchRides, 500).bind(this);
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
    let fetchParams = this.getFetchParams();
    let countParams = {
      ...this.getFetchParams(),
      count: true,
    };
    delete countParams.page;
    delete countParams.resultsPerPage;

    this.setState({ loading: true });

    return Promise.all([
      memoizedAxios({ url, params: fetchParams }),
      memoizedAxios({ url, params: countParams })
    ])
      .then(responses => {
        this.setState({
          rides: responses[0].data,
          count: responses[1].data.count,
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
    const freetext = e.target.value;
    this.setState({
      freetext,
      page: 1,
      loading: true,
    }, () => {
      updateUrlQuery({
        freetext,
        page: null,
      });
      this.debouncedFetchRides();
    });
  }

  handleDatesChange ({ startDate, endDate }) {
    this.setState({
      fromDate: startDate,
      toDate: endDate,
      page: 1,
    }, () => {
      updateUrlQuery({
        fromDate: startDate.valueOf(),
        toDate: endDate.valueOf(),
        page: null,
      });
      this.fetchRides();
    });
  }

  handlePageChange (pageObj) {
    const page = pageObj.selected + 1;
    this.setState({ page }, () => {
      updateUrlQuery({ page });
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
          {this.renderPaginator()}
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
          {this.renderPaginator()}
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

  renderPaginator () {
    return (
      <div className='d-flex justify-content-center'>
        <Paginator
          initialPage={this.state.page - 1}
          pageCount={Math.ceil(this.state.count / RESULTS_PER_PAGE)}
          onPageChange={this.handlePageChange}
          disableInitialCallback={true}
        />
      </div>
    );
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
