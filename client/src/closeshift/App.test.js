import { App } from './App';
import { shallow } from 'enzyme';

describe.only('close shift App', function() {
    it('renders without crashing', function() {
        shallow(<App />);
    });
});
