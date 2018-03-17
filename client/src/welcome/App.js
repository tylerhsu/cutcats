import React from 'react';
import requiresAuth from '../global/requiresAuth';
import { hot } from 'react-hot-loader';
import Navbar from '../navbar';
import {
    Container,
    Row,
    Col
} from 'reactstrap';
import logoUrl from '../static/cat-logo.png';

export class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
              <Navbar />
              <Container>
                <Row>
                  <Col className="text-center">
                    <img src={logoUrl} />
                    <h3 className="mt-2">
                      Welcome to Cut Cats!
                    </h3>
                  </Col>
                </Row>
              </Container>
            </React.Fragment>
        );
    }
}

export default hot(module)(requiresAuth(App));
