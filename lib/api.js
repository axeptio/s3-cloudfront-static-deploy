/*
 * Require
 */

const AWS = require('aws-sdk');
const { success, error } = require('./functions');

/*
 * Consts
 */

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

/*
 * API
 */

function putJson(myBucket, filename, content, event) {
  const putParams = {
    Bucket: myBucket,
    Key: filename,
    Body: JSON.stringify(content)
  };

  return new Promise((resolve, reject) => {
    s3.putObject(putParams, (err, data) => {
      if (err) {
        error('putJson', err);
        reject(err);
      } else {
        event(success('putJson'));
        resolve(data);
      }
    });
  });
}

function invalidateFile(filename, distributionId, event) {
  // set unique ID with timestamp
  const timestampId = Date.now().toString();
  const invaParams = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: timestampId,
      Paths: {
        Quantity: 1,
        Items: [
          `/${filename}`
        ]
      }
    }
  };
  return new Promise((resolve, reject) => {
    cloudfront.createInvalidation(invaParams, (err, data) => {
      if (err) {
        event(error('invalidateFile', err));
        reject(new Error(err));
      } else {
        event(success('invalidateFile'));
        resolve(data);
      }
    });
  });
}

function publishJson(myBucket, filename, distributionId, content, event) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await putJson(myBucket, filename, content, event),
          await invalidateFile(filename, distributionId, event)
        ];
        event(success('publishJson'));
        resolve(actions);
      } catch (err) {
        event(error('publishJson', err));
        reject(err);
      }
    })();
  });
}

/*
 * Exports
 */

module.exports = {
  putJson,
  invalidateFile,
  publishJson
};
