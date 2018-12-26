/**
 * S3 cloudfront static deploy API
 * Created by Olivier Malige
 * Licensed under The MIT License.
 */

/*
 * Require
 */
const { success, error } = require('./functions');

/*
 * API
 */
/**
 * @function putFile
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.filename
 * @param {String} options.content
 * @param {Function} onEvent
 * Create or update a file in a bucket.
 */
function putFile({ s3 }, { bucket, filename, content }, onEvent) {
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
        success(onEvent, 'putFile', 'the file was successfully created or modified on the s3 bucket');
        resolve(data);
      }
    });
  });
}

/**
 * @function invalidateFile
 * @param {Object} clients
 * @param {CloudFront} clients.cloudfront
 * @param {Object} options
 * @param {string} options.filename
 * @param {string} options.distributionId
 * @param {Function} onEvent
 * Invalidate file in cloudfront for deploying
 */
function invalidateFile({ cloudfront }, { filename, distributionId }, onEvent) {
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
  console.info(params);
  return new Promise((resolve, reject) => {
    cloudfront.createInvalidation(params, (err, data) => {
      if (err) {
        onEvent(error('invalidateFile', err));
        reject(new Error(err));
      } else {
        onEvent(success('invalidateFile', 'the file was successfully invalidate on cloudfront'));
        resolve(data);
      }
    });
  });
}

/**
 * @function publishFile
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {CloudFront} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {String} options.filename
 * @param {String} options.content
 * @param {Function} onEvent
 * Create/update and invalidate file for cloudfront deploying.
 */
function publishFile(clients, {
  bucket, distributionId, filename, content
}, onEvent) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await putFile(clients, { bucket, filename, content }, onEvent),
          await invalidateFile(clients, { filename, distributionId }, onEvent)
        ];
        onEvent(success('publishFile', 'the file was successfully create or modified on s3 bucket and invalidate on cloudfront'));
        resolve(actions);
      } catch (err) {
        onEvent(error('publishFile', err));
        reject(err);
      }
    })();
  });
}

/**
 * @function listFileVersions
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.filename
 * @param {Function} onEvent
 * List all versions of a file in a bucket.
 */
function listFileVersions({ s3 }, { bucket, filename }, onEvent) {
  const params = {
    Bucket: bucket,
    Prefix: filename
  };
  return new Promise((resolve, reject) => {
    s3.listObjectVersions(params, (err, data) => {
      if (err) {
        onEvent(error('listFileVersions', err));
        reject(err);
      } else {
        onEvent(success('listFileVersions', `the versions of the file are: ${data}`));
        resolve(data);
      }
    });
  });
}

/**
 * @function enableVersioning
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {Boolean} options.isEnabled
 * @param {Function} onEvent

 * Enabled or suspended versionning of a bucket.
 */
function enableVersioning({ s3 }, { bucket, isEnabled }, onEvent) {
  const status = isEnabled ? 'Enabled' : 'Suspended';
  const params = {
    Bucket: bucket,
    VersioningConfiguration: {
      Status: status
    }
  };
  return new Promise((resolve, reject) => {
    s3.putBucketVersioning(params, (err) => {
      if (err) {
        onEvent(error('enableVersioning', err));
        reject(err);
      } else {
        onEvent(success('enableVersioning', `the versioning of the bucket is in mode ${status}`));
        resolve({
          versionningStatus: status
        });
      }
    });
  });
}

/**
 * @function deleteFile
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {Function} onEvent
 * Apply deleted mark on a last version of a file in a bucket.
 */
function deleteFile({ s3 }, { bucket, filename }, onEvent) {
  const params = {
    Bucket: bucket,
    Key: filename
  };
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        onEvent(error('deleteFile', err));
        reject(err);
      } else {
        onEvent(success('deleteFile', 'the latest version of the file has received the deletion marker'));
        resolve(data);
      }
    });
  });
}

/**
 * @function rollbackFile
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {CloudFront} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {Function} onEvent
 * Mark deleted the lasted version of a file in a bucket and invalidate.
 */
function rollbackFile(clients, { bucket, filename, distributionId }, onEvent) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await deleteFile(clients, { bucket, filename }, onEvent),
          await invalidateFile(clients, { filename, distributionId }, onEvent)
        ];
        onEvent(success('rollbackFile', 'the latest version of the file received the deletion marker and was invalidate on cloudfront'));
        resolve(actions);
      } catch (err) {
        onEvent(error('rollbackFile', err));
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
