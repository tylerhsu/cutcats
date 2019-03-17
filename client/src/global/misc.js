import qs from 'querystring';

export function precisionRound (number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

export function getErrorMessage (error) {
  if (error.response && error.response.data && error.response.data.message) {
    if (error.response.status < 500) {
      return error.response.data.message;
    } else {
      return `Something unexpected went wrong. The message from the server was "${error.response.data.message}"`;
    }
  } else {
    return error.message || error.toString();
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
