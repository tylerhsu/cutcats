# PDF Service
AWS Lambda function that generates a PDF from a [pdfmake document definition](https://pdfmake.github.io/docs/document-definition-object/).

## Development
1. Make changes
2. Run locally:
```
npm run invoke -- local --path <path to input file>
```
2. Deploy to the development environment:
```
npm run deploy -- --stage dev
```
3. Tail the logs in a separate console window:
```
npm run logs -- --stage dev
```
4. Invoke the function:
```
npm run invoke -- --stage dev --path <path to input file>
```

## Deployment
### Automatic Deployment
Automatic deployment to staging and production is configured in the root project's .travis.yml file.

### Manual Deployment
If you want to deploy to AWS manually, run the following commands in this directory:
```
# development/staging
npm run deploy -- --stage dev

# production
npm run deploy -- --stage production
```
