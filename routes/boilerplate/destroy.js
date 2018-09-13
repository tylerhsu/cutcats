function getQuery(model, req) {
  return model.findOne({_id: req.params.id });
}

function respond (query, req, res, next) {
  return query.exec()
    .then(document => {
      if (!document) {
        const err = new Error('Not found');
        err.statusCode = 404;
        throw err;
      }
      return document.remove();
    })
    .then(() => {
      res.status(204).send();
    })
    .catch(next);
}

function destroy (model) {
  return (req, res, next) => {
    const query = getQuery(model, req);
    return respond(query, req, res, next);
  };
}

module.exports = destroy;
module.exports.getQuery = getQuery;
module.exports.respond = respond;
