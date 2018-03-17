import { hot } from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '../global/global';

import { configureUrlQuery } from 'react-url-query';
import history from '../global/history';
configureUrlQuery({ history });

ReactDOM.render(
    <App />,
    document.getElementById('root')
);

