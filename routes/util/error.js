module.exports = function error (msg, status = 500) {
  let err = new Error(msg);
  err.status = status;
  return err;
};
