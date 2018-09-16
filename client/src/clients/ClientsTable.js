import React from 'react';
import axios from 'axios';
import ClientForm from './ClientForm';
import { Modal } from 'reactstrap';
import { getErrorMessage } from '../global/misc';

export default class ClientsTable extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      clients: null,
      zones: null,
      freetext: '',
      modalOpen: false,
      clientBeingEdited: null,
      formErrorMessage: ''
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentDidMount () {
    this.fetchClients();
    this.fetchZones();
  }

  fetchClients () {
    let url = '/api/clients';

    let params = {
      q: this.state.freetext
    };

    if (this.state.freetext) {
      params.q = this.state.freetext;
    }

    return axios.get(url, { params })
      .then(res => {
        this.setState({ clients: res.data });
      });
  }

  fetchZones () {
    let url = '/api/zones';

    return axios.get(url)
      .then(res => {
        this.setState({ zones: res.data });
      });
  }

  handleFreetextChange (e) {
    this.setState({
      freetext: e.target.value
    }, () => {
      this.fetchClients();
    });
  }

  openModal (client) {
    this.setState({
      clientBeingEdited: client,
      modalOpen: true,
      formErrorMessage: ''
    });
  }

  closeModal () {
    this.setState({
      clientBeingEdited: null,
      modalOpen: false,
      formErrorMessage: ''
    });
  }

  handleFormSubmit (client) {
    let url, method;

    if (client._id) {
      url = `/api/clients/${client._id}`;
      method = 'PATCH';
    } else {
      url = '/api/clients';
      method = 'POST';
    }

    return axios({
      url,
      method,
      data: client
    })
      .then(res => {
        const indexToReplace = this.state.clients.findIndex(client => (client._id === res.data._id));
        let clients = this.state.clients.slice();
        if (indexToReplace === -1) {
          clients.unshift(res.data);
        } else {
          clients.splice(indexToReplace, 1, res.data);
        }

        this.setState({ clients });
        this.closeModal();
      })
      .catch(err => {
        this.setState({ formErrorMessage: getErrorMessage(err) });
      });
  }

  renderTable () {
    if (!this.state.clients) {
      return null;
    }

    if (this.state.clients.length) {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.state.clients.map(client => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td>
                  <button onClick={() => this.openModal(client)} className='btn btn-link'>
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
                <input id="freetext" className="form-control" name="freetext" type="text" value={this.state.freetext} onChange={this.handleFreetextChange} placeholder="Search by name" />
              </div>
            </div>
            <div className="col text-lg-right mb-4">
              <button className="btn btn-info" onClick={() => this.openModal()}>
                <i className="fa fa-plus mr-2" />
                      Add Client
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
          <ClientForm client={this.state.clientBeingEdited}
            onSubmit={this.handleFormSubmit}
            onCancel={this.closeModal}
            errorMessage={this.state.formErrorMessage}
            zones={this.state.zones || []}
          />
        </Modal>
      </React.Fragment>
    );
  }
}
