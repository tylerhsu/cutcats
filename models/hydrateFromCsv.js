module.exports = function (csvRow, columnMap, cache = {}) {
  for (let key in csvRow) {
    csvRow[key.toLowerCase()] = csvRow[key];
  }

  const missingColumns = Object.keys(columnMap)
    .filter(columnName => {
      return !csvRow.hasOwnProperty(columnName.toLowerCase());
    });

  if (missingColumns.length) {
    const columnNames = missingColumns.map(columnName => `"${columnName}"`).join(', ');
    return Promise.reject(new Error(`The following columns are missing: ${columnNames}`));
  }

  const hydrateFields = Object.keys(columnMap).map(columnName => {
    columnName = columnName.toLowerCase();

    let modelField = columnMap[columnName];
    let csvValue = csvRow[columnName];
    const hydrateField = modelField.hydrate || (() => Promise.resolve(csvValue));

    if (typeof (modelField) === 'object') {
      modelField = modelField.name;
    }

    csvValue = csvValue.trim();

    try {
      return Promise.resolve(hydrateField(csvValue, csvRow, cache))
        .then(value => ({ [modelField]: value }));
    } catch (err) {
      return Promise.reject(err);
    }
  });

  return Promise.all(hydrateFields)
    .then(fields => {
      const obj = fields.reduce((memo, field) => {
        Object.assign(memo, field);
        return memo;
      }, {});

      return obj;
    });
};
