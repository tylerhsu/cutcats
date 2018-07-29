'use strict';

const _ = require('underscore');

/**
   Query for a document by an id found in the request url and attach the document to the req object.
   Return 404 if no document found.

   @param {Model} model - Mongoose model to use for the query.
   @param {String} options.assignTo - Assign the fetched document to this key on the req object.
   @param {String} options.idParam - Name of the url parameter containing the id to query for.
   @param {Array} options.populate - List of fields to populate when fetching the document.
   @param {Object} options.extraQueryConditions - Any additional conditions to include in the query used to fetch the document.
 */
function getDocument (model, options) {
  options = Object.assign({}, {
    assignTo: firstLower(model.modelName),
    idParam: 'id',
    populate: [],
    extraQueryConditions: {}
  }, options);

  if (!Array.isArray(options.populate)) {
    options.populate = [options.populate];
  }

  return function (req, res, next) {
    let populate = (options.populate || []).concat(req.query.populate || []);

    Promise.resolve()
      .then(() => {
        const query = model.findOne(_.extend({ _id: req.params[options.idParam] }, options.extraQueryConditions));

        if (populate && populate.length) {
          query.deepPopulate(populate);
        }
        return query.exec();
      })
      .then(document => {
        if (!document) {
          const err = new Error('Not found');
          err.statusCode = 404;
          throw err;
        }

        req[options.assignTo] = document;
        next();
      })
      .catch(next);
  };
}

function firstLower (str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

module.exports = getDocument;
