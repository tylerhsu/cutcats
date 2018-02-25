import React from 'react';
import fetch from 'cross-fetch';
import qs from 'qs';

export default function requiresAuth(WrappedComponent) {
    return class extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                user: null
            };
        }

        componentWillMount() {
            fetch('/api/me', { headers: { 'accept': 'application/json' } })
                .then(res => {
                    if (res.status !== 200) {
                        throw new Error('Unauthorized');
                    } else {
                        return res.json();
                    }
                })
                .then(user => {
                    this.setState({ user });
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

        render() {
            if (this.state.user) {
                return (
                    <WrappedComponent user={this.state.user} {...this.props} />
                );
            } else {
                return null;
            }
        }
    }
}
