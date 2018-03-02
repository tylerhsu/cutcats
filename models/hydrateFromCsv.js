module.exports = function(csvRow, columnMap) {
    for (let key in csvRow) {
        csvRow[key.toLowerCase()] = csvRow[key];
    }
    
    const hydrateFields = Object.keys(columnMap).map(columnName => {
        columnName = columnName.toLowerCase();
            
        let modelField = columnMap[columnName];
        const csvValue = csvRow[columnName]
        const hydrateField = modelField.hydrate || (() => Promise.resolve(csvValue))

        if (typeof(modelField) === 'object') {
            modelField = modelField.name;
        }

        if (!csvRow.hasOwnProperty(columnName)) {
            return Promise.reject(new Error(`Expected a column named "${columnName}"`));
        }

        try {
            return Promise.resolve(hydrateField(csvValue, csvRow))
                .then(value => ({ [modelField]: value }));
        } catch(err) {
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
}
