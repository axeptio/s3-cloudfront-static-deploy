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

function putFile(bucket, filename, content, event) {
  const params = {
    Bucket: bucket,
    Key: filename,
    Body: content
  };

  return new Promise((resolve, reject) => {
    s3.putObject(params, (err, data) => {
      if (err) {
        error('putFile', err);
        reject(err);
      } else {
        event(success('putFile'));
        resolve(data);
      }
    });
  });
}

function invalidateFile(filename, distributionId, event) {
  // set unique ID with timestamp
  const timestampId = Date.now().toString();
  const params = {
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
    cloudfront.createInvalidation(params, (err, data) => {
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

function publishFile(bucket, filename, distributionId, content, event) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await putFile(bucket, filename, content, event),
          await invalidateFile(filename, distributionId, event)
        ];
        event(success('publishFile'));
        resolve(actions);
      } catch (err) {
        event(error('publishFile', err));
        reject(err);
      }
    })();
  });
}

function listFileVersions(bucket, filename, event) {
  const params = {
    Bucket: bucket,
    Prefix: filename
  };
  return new Promise((resolve, reject) => {
    s3.listObjectVersions(params, (err, data) => {
      if (err) {
        event(error('listFileVersions', err));
        reject(err);
      } else {
        event(success('listFileVersions'));
        resolve(data);
      }
    });
  });
}

function enableVersioning(bucket, isEnable, event) {
  const status = (isEnable) ? 'Enabled' : 'Suspended';

  const params = {
    Bucket: bucket,
    VersioningConfiguration: {
      Status: status
    }
  };
  return new Promise((resolve, reject) => {
    s3.putBucketVersioning(params, (err) => {
      if (err) {
        event(error('enableVersioning', err));
        reject(err);
      } else {
        event(success('enableVersioning'));
        resolve({
          status: status
        });
      }
    });
  });
}

function rollbackFile(bucket, fileName, distributionId, event) {
  var params = {
    Bucket: bucket,
    Key: fileName
  };

  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await s3.deleteObject(params, (err, data) => {
            if (err) {
              event(error('deleteFile', err));
              reject(err);
            } else {
              event(success('deleteFile'));
              resolve(data);
            }
          }),
          await invalidateFile(fileName, distributionId, event)
        ];
        event(success('rollbackFile'));
        resolve(actions);
      } catch (err) {
        event(error('rollbackFile', err));
        reject(err);
      }
    })();
  });
}

/*
 * Exports
 */

module.exports = {
  putFile,
  invalidateFile,
  publishFile,
  listFileVersions,
  enableVersioning,
  rollbackFile
};
