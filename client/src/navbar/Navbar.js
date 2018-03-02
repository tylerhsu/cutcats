import React from 'react';
import {
    Navbar as BootstrapNavbar,
    NavbarBrand,
    NavbarToggler,
    Collapse,
    Nav,
    NavItem,
    NavLink
} from 'reactstrap';

export default class Navbar extends React.Component {
    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.state = {
            isOpen: false
        };
    }

    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    render() {
        return (
            <BootstrapNavbar dark className="navbar-expand-sm bg-dark mb-4">
              <div className="container">
                <NavbarBrand href="/" >
                  Cut Cats
                </NavbarBrand>
                <NavbarToggler onClick={this.toggle} />
                <Collapse isOpen={this.state.isOpen} navbar>
                  <Nav navbar className="ml-auto text-center">
                    <NavItem active={window.location.pathname === '/closeshift'}>
                      <NavLink href="/closeshift">Close Shift</NavLink>
                    </NavItem>
                    <NavItem active={window.location.pathname === '/couriers'}>
                      <NavLink href="/couriers">Couriers</NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink href="/auth/logout">Sign out</NavLink>
                    </NavItem>
                  </Nav>
                </Collapse>
              </div>
            </BootstrapNavbar>
        );
    }
}
