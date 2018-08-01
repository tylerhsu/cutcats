import React from 'react';
import Navbar from '../../navbar';
import InvoicesTableContainer from '../containers/InvoicesTableContainer';

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
          <InvoicesTableContainer />
        </div>
      </React.Fragment>
    );
  }
}

export default App;
