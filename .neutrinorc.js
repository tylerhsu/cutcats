require('dotenv').config();

const apiPort = parseInt(process.env.PORT) || 3000;


module.exports = {
    options: {
        source: 'client/src',
        output: 'client/build',
        mains: {
            'index': 'index',
            'couriers': 'couriers',
            'closeshift': 'closeshift',
            'welcome': 'welcome',
            'quickexport': 'quickexport',
            'rides': 'rides',
            'payroll': 'payroll',
            'invoices': 'invoices',
            'clients': 'clients',
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
                        redirect: false
                    },
                    historyApiFallback: {
                        rewrites: [
                            {
                                from: /.*/,
                                to: context => (context.match + '.html')
                            }
                        ]
                    },
                    proxy: [{
                        context: ['/api', '/auth'],
                        target: 'http://localhost:' + apiPort,
                    }],
                    port: apiPort + 1
                },
                style: {
                    test: /\.s?css$/,
                    loaders: [
                        {
                            loader: 'sass-loader',
                            useId: 'sass'
                        }
                    ]
                }
            }
        ],
        '@neutrinojs/mocha',
        neutrino => neutrino.config
            .entry('vendor')
            .add('babel-polyfill')
            .add('react')
            .add('react-dom')
            .add('prop-types')
            .add('cross-fetch')
            .add('reactstrap')
    ]
};
