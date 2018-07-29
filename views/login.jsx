import React from 'react';
import PropTypes from 'prop-types';

export default function Login (props) {
  return (
    <div style={{textAlign: 'center', marginTop: '100px'}}>
      <div>Welcome to the Cut Cats World of Accounting and Reports</div>
      <a href='/auth/google'>Log in with Google</a>
      {props.error && (
        <div style={{color: 'red', marginTop: '10px'}}>Failure logging in: {props.error}</div>
      )}
    </div>
  );
}

Login.propTypes = {
  error: PropTypes.string
};
