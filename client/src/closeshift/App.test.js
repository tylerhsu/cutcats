import React from 'react';
import { App } from './App';
import { shallow } from 'enzyme';

describe('close shift App', function () {
  it('renders without crashing', function () {
    shallow(<App user={{}} />);
  });
});
