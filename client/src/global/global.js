import './global.scss';
import 'font-awesome/css/font-awesome.css';
import axios from 'axios';

axios.defaults.withCredentials = true;

if (module.hot) {
  module.hot.accept('./global.scss');
}

