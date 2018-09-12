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
