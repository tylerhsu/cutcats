import React from 'react';
import _ from 'lodash';
import axios from 'axios';
import CourierForm from './CourierForm';
import { Modal } from 'reactstrap';
import moment from 'moment';
import { getErrorMessage, getUrlQuery, updateUrlQuery } from '../global/misc';
import Paginator from '../global/Paginator';

const RESULTS_PER_PAGE = 100;

export default class CouriersTable extends React.Component {
  constructor (props) {
    super(props);

    const query = getUrlQuery();
    this.state = {
      couriers: null,
      freetext: query.freetext || '',
      hasRadio: query.hasRadio || '',
      modalOpen: false,
      courierBeingEdited: null,
      formErrorMessage: '',
      loading: true,
      page: 1,
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.handleHasRadioChange = this.handleHasRadioChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.debouncedFetchCouriers = _.debounce(this.fetchCouriers, 500).bind(this);
  }

  componentDidMount () {
    return this.fetchCouriers();
  }

  fetchCouriers () {
    let url = '/api/couriers';

    const baseParams = {
      q: this.state.freetext,
      hasRadio: this.state.hasRadio,
    };
    const fetchParams = {
      ...baseParams,
      resultsPerPage: RESULTS_PER_PAGE,
      page: this.state.page,
    };
    const countParams = {
      ...baseParams,
      count: true,
    };

    this.setState({ loading: true });

    return Promise.all([
      axios({ url, params: fetchParams }),
      axios({ url, params: countParams }),
    ])
      .then(responses => {
        const [fetchResponse, countResponse] = responses;
        this.setState({
          couriers: fetchResponse.data,
          count: countResponse.data.count,
        });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleFreetextChange (e) {
    const freetext = e.target.value;
    this.setState({
      freetext,
      loading: true,
      page: 1,
    }, () => {
      updateUrlQuery({
        freetext,
        page: null,
      });
      this.debouncedFetchCouriers();
    });
  }

  handleHasRadioChange (e) {
    const hasRadio = e.target.value;
    this.setState({
      hasRadio,
      loading: true,
      page: 1,
    }, () => {
      updateUrlQuery({
        hasRadio: hasRadio === '' ? null : hasRadio,
        page: null,
      });
      this.debouncedFetchCouriers();
    });
  }

  handlePageChange (pageObj) {
    const page = pageObj.selected + 1;
    this.setState({ page }, () => {
      updateUrlQuery({ page });
      this.fetchCouriers();
    });
  }

  openModal (courier) {
    this.setState({
      courierBeingEdited: courier,
      modalOpen: true,
      formErrorMessage: ''
    });
  }

  closeModal () {
    this.setState({
      courierBeingEdited: null,
      modalOpen: false,
      formErrorMessage: ''
    });
  }

  handleFormSubmit (courier) {
    let url, method;

    if (courier._id) {
      url = `/api/couriers/${courier._id}`;
      method = 'PATCH';
    } else {
      url = '/api/couriers';
      method = 'POST';
    }

    return axios({
      url,
      method,
      data: courier
    })
      .then(res => {
        const indexToReplace = this.state.couriers.findIndex(courier => (courier._id === res.data._id));
        let couriers = this.state.couriers.slice();
        if (indexToReplace === -1) {
          couriers.unshift(res.data);
        } else {
          couriers.splice(indexToReplace, 1, res.data);
        }

        this.setState({ couriers });
        this.closeModal();
      })
      .catch(err => {
        this.setState({ formErrorMessage: getErrorMessage(err) });
      });
  }

  renderPaginator () {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          Showing {this.state.count !== undefined ? this.state.count : ''} couriers
        </div>
        <Paginator
          initialPage={this.state.page - 1}
          pageCount={Math.ceil(this.state.count / RESULTS_PER_PAGE)}
          onPageChange={this.handlePageChange}
          disableInitialCallback={true}
        />
      </div>
    );
  }

  renderTable () {
    if (!this.state.couriers) {
      return null;
    }

    if (this.state.couriers.length) {
      return (
        <React.Fragment>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Call Number</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Monthly Radio Rental?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {this.state.couriers.map(courier => (
                <tr key={courier._id}>
                  <td>{courier.name}</td>
                  <td>{courier.radioCallNumber}</td>
                  <td style={{whiteSpace: 'nowrap'}}>{courier.phone || <None />}</td>
                  <td>{courier.email}</td>
                  <td>{courier.status}</td>
                  <td>{courier.startDate ? moment(courier.startDate).format('M/D/YYYY') : <None />}</td>
                  <td>{courier.monthlyRadioRental ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => this.openModal(courier)} className="btn btn-link">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {this.renderPaginator()}
        </React.Fragment>
      );
    } else {
      return (
        <div>No results matching &quot;{this.state.freetext}&quot;</div>
      );
    }
  }

  render () {
    return (
      <React.Fragment>
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-4">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
                <input id="freetext" className="form-control" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by name or email" />
              </div>
            </div>
            <div className="col-lg-2 mb-4 d-flex align-items-center" style={{ gap: '.5rem' }}>
              <label htmlFor="has-radio" style={{ flexShrink: 0, margin: 0 }}>Has radio?</label>
              <select id="has-radio" name="hasRadio" className="form-control" value={this.state.hasRadio} onChange={this.handleHasRadioChange}>
                <option value=""></option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="col text-lg-right mb-4">
              <button className="btn btn-info" onClick={() => this.openModal()}>
                <i className="fa fa-plus mr-2" />
                  Add Courier
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col">
              {this.renderPaginator()}
              {
                this.state.loading ? (
                  <em className='text-secondary'>Loading...</em>
                ) : (
                  this.renderTable()
                )
              }
            </div>
          </div>
        </div>
        <Modal isOpen={this.state.modalOpen} toggle={this.closeModal}>
          <CourierForm courier={this.state.courierBeingEdited}
            onSubmit={this.handleFormSubmit}
            onCancel={this.closeModal}
            errorMessage={this.state.formErrorMessage}
          />
        </Modal>
      </React.Fragment>
    );
  }
}

function None () {
  return <em className='text-secondary'>None</em>;
}
