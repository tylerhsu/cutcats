function getQuery(model, req) {
  const query = model.findOne({_id: req.params.id });

  if (req.query.populate && req.query.populate.length) {
    query.deepPopulate(req.query.populate);
  }
  return query;
}

function respond (query, req, res, next) {
  return query.exec()
    .then(document => {
      if (!document) {
        const err = new Error('Not found');
        err.statusCode = 404;
        throw err;
      }
      res.json(document);
    })
    .catch(next);
}

function getOne(model) {
  return (req, res, next) => {
    const query = getQuery(model, req);
    return respond (query, req, res, next);
  };
}

module.exports = getOne;
module.exports.getQuery = getQuery;
module.exports.respond = respond;
