import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import fetch from 'cross-fetch';
import CourierForm from './CourierForm';
import { Modal } from 'reactstrap';

export default class CouriersTable extends React.Component {
    constructor(props) {
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

    componentWillMount() {
        return this.fetchCouriers()
    }

    fetchCouriers() {
        let url = '/api/couriers',
            query = {
                q: this.state.freetext
            };

        if (this.state.freetext) {
            query.q = this.state.freetext;
        }
        
        return fetch([url, qs.stringify(query)].join('?'), { credentials: 'include' })
            .then(res => {
                return res.json();
            })
            .then(couriers => {
                this.setState({ couriers });
            });
    }

    handleFreetextChange(e) {
        this.setState({
            freetext: e.target.value
        }, () => {
            this.fetchCouriers();
        });
    }

    openModal(courier) {
        this.setState({
            courierBeingEdited: courier,
            modalOpen: true,
            formErrorMessage: ''
        });
    }

    closeModal() {
        this.setState({
            courierBeingEdited: null,
            modalOpen: false,
            formErrorMessage: ''
        });
    }

    handleFormSubmit(courier) {
        let url, method;
        
        if (courier._id) {
            url = `/api/couriers/${courier._id}`;
            method = 'PATCH';
        } else {
            url = '/api/couriers';
            method = 'POST';
        }
        
        return fetch(url, {
            credentials: 'include',
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courier)
        })
            .then(res => {
                return res.json();
            })
            .then(updatedCourier => {
                if (updatedCourier.error) {
                    throw new Error(updatedCourier.message);
                }
                
                const indexToReplace = this.state.couriers.findIndex(courier => (courier._id === updatedCourier._id));
                let couriers = this.state.couriers.slice();
                if (indexToReplace === -1) {
                    couriers.unshift(updatedCourier);
                } else {
                    couriers.splice(indexToReplace, 1, updatedCourier);
                }
                
                this.setState({ couriers });
                this.closeModal();
            })
            .catch(err => {
                this.setState({ formErrorMessage: err.message })
            });
    }

    renderTable() {
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.couriers.map(courier => (
                        <tr key={courier._id}>
                          <td>{courier.name}</td>
                          <td>{courier.radioCallNumber}</td>
                          <td>{courier.phone}</td>
                          <td>{courier.email}</td>
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
                <div>No results matching "{this.state.freetext}"</div>
            );
        }
    }

    render() {
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
