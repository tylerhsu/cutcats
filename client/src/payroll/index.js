import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import AppContainer from './containers/AppContainer';
import configureStore from '../global/store/configureStore';
import reducer from './reducers';
import '../global/global';

const store = configureStore(reducer);

ReactDOM.render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('root')
);
