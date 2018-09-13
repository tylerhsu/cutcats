import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import requiresAuth from '../../global/requiresAuth';
import { hot } from 'react-hot-loader';
import { setUser } from '../../global/reducers/user';
import App from '../components/App';

export class AppContainer extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
    this.props.setUser(this.props.user);
  }

  render () {
    return (
      <App />
    );
  }
}

AppContainer.propTypes = {
  user: PropTypes.object,
  setUser: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = {
  setUser
};

export default hot(module)(connect(mapStateToProps, mapDispatchToProps)(requiresAuth(AppContainer)));
