if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const port = (parseInt(process.env.PORT) || 3000) + 1;


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
                    proxy: 'http://localhost:' + (port - 1),
                    port: port
                }
            }
        ],
        '@neutrinojs/mocha'
    ]
};
