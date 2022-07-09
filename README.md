# Cut Cats Accounting Software
[![Build status](https://travis-ci.org/tylerhsu/cutcats.svg?branch=master)](https://travis-ci.org/tylerhsu/cutcats)

A website that assists with payroll and invoice management for Cut Cats Courier.  Built with NodeJS, Express, React, and MongoDB.

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
5. Run unit tests:
```
npm test
```
6. Run the development server:
```
npm run dev
```
7. Navigate to localhost:3001 in your browser.

## Production Build
The production bundle is generated with [Neutrino](https://neutrinojs.org), which is a wrapper around Webpack.  This project's .neutrinorc.js file contains the settings controlling how the site gets bundled for deployment.  Run the build with the following command:
```
npm run build
```

## Deployment
### Automated Deployment
This project is deployed on Heroku. Commits to the develop and master branches cause automatic deploys to staging and production, respectively.

### Manual Deployment
1. [Install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
2. Add a git remote that tracks the Heroku app:
```
# staging
heroku git:remote -a cutcats-staging
git remote rename heroku heroku-staging

# production
heroku git:remote -a cutcats-production
git remote rename heroku heroku-production
```
3. Deploy e.g. the master branch:
```
# staging
git push heroku-staging master

# production
git push heroku-production master
```

## Service Accounts
Here's a list of the accounts you'll need to access in order to administer the project.

### Heroku
Heroku hosts the website and, via the mLab Heroku addon, the MongoDB database.

Access is granted to members of the [Cut Cats "team" on Heroku](https://dashboard.heroku.com/teams/cutcats/apps).  Create a personal account if you don't already have one, then ask Tyler to add you to the team.

* [cutcats-staging on Heroku](https://dashboard.heroku.com/apps/cutcats-staging)
* [cutcats-production on Heroku](https://dashboard.heroku.com/apps/cutcats-production)

### Amazon Web Services
Payroll and invoice PDFs are stored in S3, and Lambda is used to generate those PDFs.

The AWS account belongs to Cut Cats and is managed by Tyler.  Ask to have a user created for you.

### Google
Users log in to the accounting site via google.

OAuth client IDs for local, staging, and production website deployments are managed via the Google Developer Console.  For administrative access to the developer console, ask Tyler to add your google account to the Cut Cats project.

[Cut Cats Google Developer Console](https://console.developers.google.com/apis/dashboard?authuser=0&project=cut-cats)

## Addendum: PDF Service
This project's `pdfService/` directory contains a standalone piece of software.  It's an [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) function whose purpose is to generate PDFs.  This supports the site's payroll and invoicing features, which require that tens or hundreds of PDFs be generated at once upon request.

For details on developing and deploying the PDF service, consult the readme in the `pdfService/` directory.
