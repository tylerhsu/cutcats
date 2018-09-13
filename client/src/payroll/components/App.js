import React from 'react';
import Navbar from '../../navbar';
import PayrollsTableContainer from '../containers/PayrollsTableContainer';

export class App extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <React.Fragment>
        <Navbar />
        <div className="container">
          <div className="row mb-2">
          </div>
          <PayrollsTableContainer />
        </div>
      </React.Fragment>
    );
  }
}

export default App;
