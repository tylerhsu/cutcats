require('dotenv').config();

const apiPort = parseInt(process.env.PORT) || 3000;


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
                    staticOptions: {
                        extensions: 'html'
                    },
                    proxy: [{
                        context: ['/api', '/auth'],
                        target: 'http://localhost:' + apiPort,
                    }],
                    port: apiPort + 1
                }
            }
        ],
        '@neutrinojs/mocha'
    ]
};
