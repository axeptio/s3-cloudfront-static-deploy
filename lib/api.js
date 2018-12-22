/**
 * S3 cloudfront static deploy API
 * Created by Olivier Malige
 * Licensed under The MIT License.
 */

/*
 * Require
 */

const { success, error } = require('./functions');
const S3 = require('aws-sdk/clients/s3');
const CloudFront = require('aws-sdk/clients/cloudfront');

/*
 * Const
 */

const s3 = new S3();
const cloudfront = new CloudFront();

/*
 * API
 */

/**
 * @function putFile
 * Create or update a file in a bucket.
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
        event(success('putFile', 'the file was successfully created or modified on the s3 bucket'));
        resolve(data);
      }
    });
  });
}

/**
 * @function invalidateFile
 * Invalidate file in cloudfront for deploying
 */
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
        event(success('invalidateFile', 'the file was successfully invalidate on cloudfront'));
        resolve(data);
      }
    });
  });
}

/**
 * @function publishFile
 * Create/update and invalidate file for cloudfront deploying.
 */
function publishFile(bucket, filename, distributionId, content, event) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await putFile(bucket, filename, content, event),
          await invalidateFile(filename, distributionId, event)
        ];
        event(success('publishFile', 'the file was successfully create or modified on s3 bucket and invalidate on cloudfront'));
        resolve(actions);
      } catch (err) {
        event(error('publishFile', err));
        reject(err);
      }
    })();
  });
}

/**
 * @function listFileVersions
 * List all versions of a file in a bucket.
 */
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
        event(success('listFileVersions', `the versions of the file are: ${data}`));
        resolve(data);
      }
    });
  });
}

/**
 * @function enableVersioning
 * Enabled or suspended versionning of a bucket.
 */
function enableVersioning(bucket, isEnabled, event) {
  const status = (isEnabled) ? 'Enabled' : 'Suspended';

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
        event(success('enableVersioning', `the versioning of the bucket is in mode ${status}`));
        resolve({
          versionningStatus: status
        });
      }
    });
  });
}

/**
 * @function deleteFile
 * Apply deleted mark on a last version of a file in a bucket.
 */
function deleteFile(bucket, fileName, event) {
  const params = {
    Bucket: bucket,
    Key: fileName
  };
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        event(error('deleteFile', err));
        reject(err);
      } else {
        event(success('deleteFile', 'the latest version of the file has received the deletion marker'));
        resolve(data);
      }
    });
  });
}

/**
 * @function rollbackFile
 * Mark deleted the lasted version of a file in a bucket and invalidate.
 */
function rollbackFile(bucket, fileName, distributionId, event) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await deleteFile(bucket, fileName, event),
          await invalidateFile(fileName, distributionId, event)
        ];
        event(success('rollbackFile', 'the latest version of the file received the deletion marker and was invalidate on cloudfront'));
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
