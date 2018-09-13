const _ = require('lodash');

function getDocument(model, req) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .omit((value) => (value === ''))
    .value();
  return new model(body);
}

function respond (document, req, res, next) {
  return document.save()
    .then(_document => {
      res.status(201).json(_document);
    })
    .catch(next);
}

function create (model) {
  return (req, res, next) => {
    const document = getDocument(model, req);
    return respond(document, req, res, next);
  };
}

module.exports = create;
module.exports.getDocument = getDocument;
module.exports.respond = respond;
