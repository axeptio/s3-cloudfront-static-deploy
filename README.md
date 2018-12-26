# S3 CloudFront static deploy

Simple node API for rapid file deployment (like JSON or other) in an AWS S3 bucket with cloudFront invalidate, versioning and rollback.

## :rocket: Installation

> npm install --save s3-cloudfront-static-deploy aws-sdk

For the moment you have to create and configure your bucket authorization and cloudfront from AWS

## :gear: API

### Parameters

#### AWS Clients

Instead of instanciating its own S3 and CloudFront clients, this package requires you to pass yours as the first parameter of every API functions. For example:

```javascript
const AWS = require('aws-sdk');
const clients = {
  s3: new AWS.S3(),
  cloudfront: new AWS.CloudFront()
};
publishFile(clients, options);
```

#### Options
The second parameter of the functions are the options required to execute this specific job. Documented in JSDoc.

#### Event Handlers

Due to their async nature, functions of this lib return only promises. When completed, a function will resolve, and in any erroneous case, it will reject. If you need extra control over the execution flow, (especially when there are several steps), you can use the `onEvent` param that is always the last parameter of the function call.

```javascript
publishFile(clients, options, event => {
  console.log(event.type); // "success" / "error" / "info" / "progress"
  console.log(event.method); // "invalidateFile"
  console.log(event.message); // "successfully invalidated the file"
});
```

#### Available functions

- `enableVersioning` Enabled or suspended versionning of a bucket. Options are: `bucket`, `isEnabled` 
- `publishFile` Create/update and invalidate file for cloudfront deploying. (tested only with a JSON stringify)
- `rollbackFile` Mark deleted the lasted version of a file in a bucket and invalidate on cloudfront.
- `listFileVersions` List all versions of a file in a bucket.
- `putFile` Create or update a file in a bucket. (tested only with a JSON stringify)
- `deleteFile` Apply deleted mark on a last version of a file in a bucket.
- `invalidateFile` Invalidate file in cloudfront for deploying

## :eyes: Testing

You can test the deploying with sending a Json with random data (words)

```sh
export BUCKET_NAME=${S3BucketName} DISTRIBUTION_ID=${CloudFrontDistributionID} && npm run test
```
