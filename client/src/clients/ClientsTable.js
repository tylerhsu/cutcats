import React from 'react';
import _ from 'lodash';
import axios from 'axios';
import ClientForm from './ClientForm';
import { Modal } from 'reactstrap';
import { getErrorMessage, updateUrlQuery, getUrlQuery } from '../global/misc';
import Paginator from '../global/Paginator';

const RESULTS_PER_PAGE = 100;

export default class ClientsTable extends React.Component {
  constructor (props) {
    super(props);
    
    const query = getUrlQuery();
    this.state = {
      clients: null,
      zones: null,
      freetext: query.freetext || '',
      deliveryFeeStructure: query.deliveryFeeStructure || '',
      modalOpen: false,
      clientBeingEdited: null,
      formErrorMessage: '',
      page: query.page ? parseInt(query.page) : 1,
      count: null,
      loading: true,
    };

    this.handleFreetextChange = this.handleFreetextChange.bind(this);
    this.handleDeliveryFeeStructureChange = this.handleDeliveryFeeStructureChange.bind(this);
    this.debouncedFetchClients = _.debounce(this.fetchClients, 500).bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }

  componentDidMount () {
    this.fetchClients();
    this.fetchZones();
  }

  fetchClients () {
    let url = '/api/clients';

    const baseParams = {
      q: this.state.freetext,
      deliveryFeeStructure: this.state.deliveryFeeStructure,
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
          clients: fetchResponse.data,
          count: countResponse.data.count,
        });
      })
      .finally(() => {
        this.setState({ loading: false });
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
      this.debouncedFetchClients();
    });
  }

  handleDeliveryFeeStructureChange (e) {
    const deliveryFeeStructure = e.target.value;
    this.setState({
      deliveryFeeStructure,
      loading: true,
      page: 1,
    }, () => {
      updateUrlQuery({
        deliveryFeeStructure,
        page: null,
      });
      this.debouncedFetchClients();
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

  handlePageChange (pageObj) {
    const page = pageObj.selected + 1;
    this.setState({ page }, () => {
      updateUrlQuery({ page });
      this.fetchClients();
    });
  }

  renderTable () {
    if (!this.state.clients) {
      return null;
    } else if (this.state.clients.length) {
      return (
        <React.Fragment>
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
                    <button onClick={() => this.openModal(client)} className='btn btn-link'>Edit</button>
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

  renderPaginator () {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          Showing {this.state.count !== undefined ? this.state.count : ''} clients
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
            <div className="col">
              <select id="deliveryFeeStructure" className="form-control" name="deliveryFeeStructure" value={this.state.deliveryFeeStructure} onChange={this.handleDeliveryFeeStructureChange}>
              <option value=''>Any fee structure</option>
              <option value='on demand food'>On-demand food</option>
              <option value='legacy on demand food'>Legacy on-demand food</option>
              <option value='catering food'>Catering Food</option>
              <option value='cargo/wholesale/commissary'>Cargo/wholesale/commissary</option>
              </select>
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
