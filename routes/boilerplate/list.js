function getQuery(model, req) {
  const page = parseInt(req.query.page) || 1;
  const resultsPerPage = parseInt(req.query.resultsPerPage) || 100;
  const query = model.find();

  if (req.query.populate) {
    query.populate(req.query.populate);
  }

  if (req.query.sort) {
    query.sort(req.query.sort);
  }

  if (isCount(req)) {
    query.countDocuments();
  } else {
    query.skip((page - 1) * resultsPerPage).limit(resultsPerPage);
  }

  return query;
}

function respond (query, req, res, next) {
  return query.exec()
    .then(results => {
      if (isCount(req)) {
        res.json({ count: results });
      } else {
        res.json(results);
      }
    })
    .catch(next);
}

function isCount(req) {
  return ['true', '1'].indexOf(req.query.count) > -1;
}

function list (model) {
  return (req, res, next) => {
    const query = getQuery(model, req);
    return respond(query, req, res, next);
  };
}

module.exports = list;
module.exports.getQuery = getQuery;
module.exports.respond = respond;
