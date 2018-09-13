const _ = require('lodash');

function getQuery(model, req) {
  return model.findOne({_id: req.params.id });
}

function getDocument(query, req) {
  const body = _.chain(req.body)
    .omit(['_id', 'updatedAt', 'createdAt', '__v'])
    .value();
  return query.exec()
    .then(document => {
      if (!document) {
        const err = new Error('Not found');
        err.statusCode = 404;
        throw err;
      }
      document.set(body);
      return document;
    });
}

function respond (document, req, res, next) {
  return document.save()
    .then(_document => {
      if (req.query.populate && req.query.populate.length) {
        return _document.deepPopulate(req.query.populate);
      } else {
        return _document;
      }
    })
    .then(_document => {
      res.json(_document);
    })
    .catch(next);
}

function update (model) {
  return (req, res, next) => {
    const query = getQuery(model, req);
    return getDocument(query, req)
      .then(document => {
        return respond(document, req, res, next);
      });
  };
}

module.exports = update;
module.exports.getQuery = getQuery;
module.exports.getDocument = getDocument;
module.exports.respond = respond;
