import _ from 'lodash';
import 'should';

export function save() {
  return Promise.all(_.flatten(arguments).map(doc => {
    return doc.save();
  }));
}

export function idsShouldBeEqual(...args) {
  args.forEach(arg => getId(arg).should.eql(getId(args[0])));
}

export function getId(obj) {
  return obj._id ? obj._id.toString() : obj.toString();
}
