if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

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
      'rides': 'rides',
      'payroll': 'payroll',
      'invoices': 'invoices',
      'clients': 'clients',
    },
    tests: 'client'
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
          modules: true,
          modulesTest: /\.module.s?css$/,
          loaders: [
            {
              loader: 'sass-loader',
              useId: 'sass'
            }
          ]
        }
      }
    ],
    [
      '@neutrinojs/mocha',
      {
        exit: true
      }
    ],
    neutrino => neutrino.config
      .entry('vendor')
      .add('babel-polyfill')
      .add('react')
      .add('react-dom')
      .add('prop-types')
      .add('axios')
      .add('reactstrap')
      .add('moment')
      .add('lodash')
  ]
};
