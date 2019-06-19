import qs from 'querystring';
import * as _ from 'lodash';

export function precisionRound (number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

export function getErrorMessage (error) {
  const message = _.get(error, 'response.data.message') ||
    _.get(error, 'response.data') ||
    _.get(error, 'message') ||
    error.toString();
  if (_.get(error, 'response.status', 500) < 500) {
    return message;
  } else {
    return `Something unexpected went wrong. The message from the server was "${message}"`;
  }
}

export function updateUrlQuery (obj) {
  const query = getUrlQuery();
  const updatedQuery = {
    ...query,
    ...obj,
  };
  Object.keys(updatedQuery).forEach(key => {
    if (updatedQuery[key] === null || updatedQuery[key] === undefined) {
      delete updatedQuery[key];
    }
  });
  const updatedQueryString = Object.keys(updatedQuery).length ? `?${qs.stringify(updatedQuery)}` : '';
  window.history.replaceState({}, '', `${window.location.pathname}${updatedQueryString}`);
}

export function getUrlQuery () {
  return qs.parse(window.location.search.replace('?', ''));
}
