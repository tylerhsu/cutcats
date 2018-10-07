import React from 'react';
import axios from 'axios';
import CourierForm from './CourierForm';
import { Modal } from 'reactstrap';
import moment from 'moment';
import { getErrorMessage } from '../global/misc';

export default class CouriersTable extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      couriers: null,
      freetext: '',
      modalOpen: false,
      courierBeingEdited: null,
      formErrorMessage: ''
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentDidMount () {
    return this.fetchCouriers();
  }

  fetchCouriers () {
    let url = '/api/couriers';

    let params = {
      q: this.state.freetext
    };

    if (this.state.freetext) {
      params.q = this.state.freetext;
    }

    return axios.get(url, { params })
      .then(res => {
        this.setState({ couriers: res.data });
      });
  }

  handleFreetextChange (e) {
    this.setState({
      freetext: e.target.value
    }, () => {
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

  renderTable () {
    if (!this.state.couriers) {
      return null;
    }

    if (this.state.couriers.length) {
      return (
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
            <div className="col text-lg-right mb-4">
              <button className="btn btn-info" onClick={() => this.openModal()}>
                <i className="fa fa-plus mr-2" />
                      Add Courier
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col">
              { this.renderTable() }
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
