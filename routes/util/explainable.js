/*
   Let the given function optionally return a two-element array whose first element
   is the original return value and whose second is a string annotation explaining the return value.

   Returns a version of that function that may accept an { explain: true } option as the last argument.
   If options.explain is false, the function's original behavior is unaltered.  If options.explain is true,
   the function returns an object { value, reason }.
 */
module.exports = function explainable(func) {
  return (...args) => {
    const lastArg = args[args.length - 1];
    const explain = typeof(lastArg) === 'object' && lastArg.explain;
    const result = func(...args);
    const [value, reason] = Array.isArray(result) ? result : [result, ''];
    return explain ? { value, reason } : value;
  };
};
