import _ from 'lodash';
import 'should';

export function save() {
  return Promise.all(_.flatten(arguments).map(doc => {
    return doc.save();
  }));
}

export function idsShouldBeEqual(...args) {
  args = args.map(arg => arg._id ? arg._id.toString() : arg.toString());
  args.forEach(arg => arg.should.eql(args[0]));
}
