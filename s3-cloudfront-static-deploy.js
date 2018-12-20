/*
 * Require
 */
const AWS = require('aws-sdk');

/*
 * Consts
 */
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

/*
* Functions
*/
function success(data) {
  return {
    status: 'success',
    result: data
  };
}

function error(message) {
  return {
    status: 'error',
    message: message
  };
}

/*
 * API
 */
module.exports = {
  publishFile(myBucket, filename, distributionId, content, event) {
    // set unique ID with timestamp
    const timestampId = Date.now().toString();

    const putParams = {
      Bucket: myBucket,
      Key: filename,
      Body: JSON.stringify(content)
    };
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
      s3.putObject(putParams, (putErr) => {
        if (putErr) {
          event('error during putObject');
          reject(new Error(error(putErr)));
        } else {
          event('Successfully uploaded data');
          cloudfront.createInvalidation(invaParams, (invaErr, data) => {
            if (invaErr) {
              event('error during createInvalidation');
              reject(new Error(error(invaErr)));
            } else {
              event('Successfully invalidate data');
              resolve(success(data));
            }
          });
        }
      });
    });
  }
};
