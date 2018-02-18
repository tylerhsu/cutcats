module.exports = {
    options: {
        source: 'client/src',
        output: 'client/build',
        mains: {
            'couriers': 'couriers'
        }
    },
    use: [
        [
            '@neutrinojs/react',
            {
                html: {
                    title: 'cutcats'
                },
                devServer: {
                    proxy: 'http://localhost:3000'
                }
            }
        ],
        '@neutrinojs/mocha'
    ]
};
