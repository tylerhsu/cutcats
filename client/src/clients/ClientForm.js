import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    InputGroup,
    InputGroupAddon,
    FormText,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';

export default class ClientForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            client: this.props.client || {}
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        let fieldName = e.target.name;
        let fieldValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        
        this.setState({
            client: {
                ...this.state.client,
                [fieldName]: fieldValue
            }
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        return this.props.onSubmit(this.state.client);
    }

    render() {
        return (
            <Form onSubmit={this.handleSubmit}>
              <ModalHeader>
                {this.props.client ? this.props.client.name : 'New Client'}
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <Label for='name'>Name</Label>
                  <Input id='name' type='text' name='name' value={this.state.client.name || ''} onChange={this.handleChange} autoFocus />
                </FormGroup>
                <FormGroup>
                  <Label for='qbName'>QB Name</Label>
                  <Input id='qbName' type='text' name='qbName' value={this.state.client.qbName || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='paymentType'>Payment Type</Label>
                  <Input id='paymentType' type='select' name='paymentType' value={this.state.client.paymentType} onChange={this.handleChange}>
                    <option value='invoiced' >Invoiced</option>
                    <option value='paid'>Paid</option>
                    <option value='legacy'>Legacy</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for='rep'>Rep</Label>
                  <Input id='rep' type='text' name='rep' value={this.state.client.rep || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='company'>Company</Label>
                  <Input id='company' type='text' name='company' value={this.state.client.company || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='address'>Address</Label>
                  <Input id='address' type='text' name='address' value={this.state.client.address || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='phone'>Phone</Label>
                  <Input id='phone' type='text' name='phone' value={this.state.client.phone || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='email'>Email</Label>
                  <Input id='email' type='text' name='email' value={this.state.client.email || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='zone'>Zone</Label>
                  <Input id='zone' type='select' name='zone' value={this.state.client.zone._id || this.state.client.zone} onChange={this.handleChange}>
                    {this.props.zones.map(zone => (
                        <option key={zone._id} value={zone._id}>{zone.name}</option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for='fixedAdminFee'>Fixed Admin Fee</Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>$</InputGroupAddon>
                    <Input id='fixedAdminFee' type='text' name='fixedAdminFee' value={this.state.client.fixedAdminFee || ''} onChange={this.handleChange} />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for='billingEmail'>Billing Email</Label>
                  <Input id='billingEmail' type='text' name='billingEmail' value={this.state.client.billingEmail || ''} onChange={this.handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label for='hours'>Hours</Label>
                  <Input id='hours' type='text' name='hours' value={this.state.client.hours || ''} onChange={this.handleChange} />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                {this.props.errorMessage &&
                    <div className='text-danger mr-auto'>
                      <i className='fa fa-exclamation-circle mr-2' />
                      {this.props.errorMessage}
                    </div>
                }
                <Button type='submit' color='primary'>Save</Button>
                <Button color='link' onClick={this.props.onCancel}>Cancel</Button>
              </ModalFooter>
            </Form>
        );
    }
}

ClientForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    zones: PropTypes.array.isRequired,
    client: PropTypes.object,
    errorMessage: PropTypes.string
};
