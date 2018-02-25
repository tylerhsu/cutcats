import fetch from 'cross-fetch';
import React from 'react';

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
                    /* window.location.replace('/auth/login');*/
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
