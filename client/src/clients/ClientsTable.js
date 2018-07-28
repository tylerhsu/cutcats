import React from 'react';
import qs from 'qs';
import ClientForm from './ClientForm';
import { Modal } from 'reactstrap';

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

    let query = {
      q: this.state.freetext
    };

    if (this.state.freetext) {
      query.q = this.state.freetext;
    }

    return fetch([url, qs.stringify(query)].join('?'), { credentials: 'include' })
      .then(res => {
        return res.json();
      })
      .then(clients => {
        this.setState({ clients });
      });
  }

  fetchZones () {
    let url = '/api/zones';

    return fetch(url, { credentials: 'include' })
      .then(res => {
        return res.json();
      })
      .then(zones => {
        this.setState({ zones });
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

    return fetch(url, {
      credentials: 'include',
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(client)
    })
      .then(res => {
        return res.json();
      })
      .then(updatedClient => {
        if (updatedClient.error) {
          throw new Error(updatedClient.message);
        }

        const indexToReplace = this.state.clients.findIndex(client => (client._id === updatedClient._id));
        let clients = this.state.clients.slice();
        if (indexToReplace === -1) {
          clients.unshift(updatedClient);
        } else {
          clients.splice(indexToReplace, 1, updatedClient);
        }

        this.setState({ clients });
        this.closeModal();
      })
      .catch(err => {
        this.setState({ formErrorMessage: err.message });
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
