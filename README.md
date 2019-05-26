# Cut Cats Accounting Software
[![Build status][https://travis-ci.org/tylerhsu/cutcats.svg?branch=master] ][https://travis-ci.org/tylerhsu/cutcats]
Cut Cats accounting software

## Local Development
1. Install [nvm](https://github.com/nvm-sh/nvm).  This project manages its node version via a .nvmrc file.
2. Install [Docker](https://docs.docker.com/install).  Docker is used to run a local db during unit tests.
3. Use `nvm` to install the project's node version:
```
nvm install
```
4. Install dependencies:
```
npm install
```
5. Run the development server:
```
npm run dev
```
6. Navigate to localhost:3001 in your browser.
7. Run tests:
```
npm test
```

## Tooling
A summary of tools being used to build, deploy, and otherwise configure the application.

### Build
Deployable artifacts, i.e. the production bundle, are generated with [Neutrino](https://neutrinojs.org), which is basically convenience wrapper around Webpack.  This project's .neutrinorc.js file contains the settings controlling how the site gets bundled for deployment.

### Deployment
This project contains a .travis.yml file for use with [Travis CI](https://travis-ci.org).  Set up a free account there if you don't already have one, then link it to this repo.  Once you've done that, pushes to the `develop` and `master` branches will cause Travis CI to deploy to staging and production, respectively.

## Service Accounts
The website is deployed on Heroku and uses a couple other cloud services to support specific features.  Here's a description of what those services are, how they're being used, and how to gain access to them.
### Heroku

### AWS
### Google
