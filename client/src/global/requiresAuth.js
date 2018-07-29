import React from 'react';
import qs from 'qs';
import axios from 'axios';

export default function requiresAuth (WrappedComponent) {
  return class RequiresAuth extends React.Component {
    constructor (props) {
      super(props);

      this.state = {
        user: null
      };
    }

    componentDidMount () {
      axios.get('/api/me')
        .then(res => {
          this.setState({ user: res.data });
        })
        .catch(() => {
          const returnUrl = (window.location.pathname || '') + (window.location.search || '');
          let loginUrl = '/auth/login';
          if (returnUrl) {
            loginUrl += '?' + qs.stringify({ returnUrl });
          }
          window.location.replace(loginUrl);
        });
    }

    render () {
      if (this.state.user) {
        return (
          <WrappedComponent user={this.state.user} {...this.props} />
        );
      } else {
        return null;
      }
    }
  };
}
