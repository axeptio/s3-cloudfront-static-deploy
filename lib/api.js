/**
 * S3 cloudfront static deploy API
 * Created by Olivier Malige
 * Licensed under The MIT License.
 */

/*
 * Require
 */
const {
  success, error, progress, info
} = require('./functions');

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
 * @param {String} options.contentType
 * @param {Function} onEvent
 * Create or update a file in a bucket.
 */
function putFile({ s3 }, {
  bucket, filename, content, contentType
}, onEvent) {
  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: bucket,
      Key: filename,
      Body: content,
      ContentType: contentType
    }, (err, data) => {
      if (err) {
        error(onEvent, 'putFile', err);
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
 * @param {string} options.distributionId
 * @param {string} options.invalidationId
 * @param {Function} onEvent
 * Check the progress of an invalidation request
 */
function checkInvalidation({ cloudfront }, { distributionId, invalidationId }, onEvent) {
  const check = (resolve, reject) => {
    cloudfront.getInvalidation({
      DistributionId: distributionId,
      Id: invalidationId
    }, (err, data) => {
      if (err) {
        error(onEvent, 'checkInvalidation', err);
        reject(new Error(String(err)));
        return;
      }
      if (data.Status === 'Completed') {
        success(onEvent, 'checkInvalidation');
        resolve(data);
      } else {
        progress(onEvent, 'checkInvalidation');
        setTimeout(() => check(resolve, reject), 2000);
      }
    });
  };
  return new Promise(check);
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
  return new Promise((resolve, reject) => {
    cloudfront.createInvalidation(params, (err, data) => {
      if (err) {
        error(onEvent, 'invalidateFile', err);
        reject(new Error(String(err)));
        return;
      }
      success(onEvent, 'invalidateFile', 'the file was successfully invalidated on cloudfront');
      checkInvalidation({ cloudfront }, {
        distributionId,
        invalidationId: data.Invalidation.Id
      }, onEvent).then(resolve).catch(reject);
    });
  });
}

/**
 * @function invalidateFiles
 * @param {Object} clients
 * @param {CloudFront} clients.cloudfront
 * @param {Object} options
 * @param {string[]} options.filenames
 * @param {string} options.distributionId
 * @param {Function} onEvent
 * Invalidate files in cloudfront for deploying
 */
function invalidateFiles({ cloudfront }, { filenames, distributionId }, onEvent) {
  // set unique ID with timestamp
  const timestampId = Date.now().toString();
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: timestampId,
      Paths: {
        Quantity: filenames.length,
        Items: filenames.map(filename => `/${filename}`)
      }
    }
  };
  return new Promise((resolve, reject) => {
    cloudfront.createInvalidation(params, (err, data) => {
      if (err) {
        error(onEvent, 'invalidateFiles', err);
        reject(new Error(String(err)));
        return;
      }
      success(onEvent, 'invalidateFiles', 'the files were successfully invalidated on cloudfront');
      checkInvalidation({ cloudfront }, {
        distributionId,
        invalidationId: data.Invalidation.Id
      }, onEvent).then(resolve).catch(reject);
    });
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
        error(onEvent, 'listFileVersions', err);
        reject(err);
      } else {
        info(onEvent, 'listFileVersions', `the versions of the file are: ${data}`);
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
        error(onEvent, 'enableVersioning', err);
        reject(err);
      } else {
        info(onEvent, 'enableVersioning', `the versioning of the bucket is in mode ${status}`);
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
        error(onEvent, 'deleteFile', err);
        reject(err);
      } else {
        success(onEvent, 'deleteFile', 'the latest version of the file has received the deletion marker');
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
        success(onEvent, 'rollbackFile', 'the latest version of the file received the deletion marker and was invalidate on cloudfront');
        resolve(actions);
      } catch (err) {
        error(onEvent, 'rollbackFile', err);
        reject(err);
      }
    })();
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
 * @param {String} options.contentType
 * @param {String} options.cloudfrontFilename
 * @param {Boolean} options.skipInvalidation
 * @param {Function} onEvent
 * Create/update and invalidate file for cloudfront deploying.
 */
function publishFile(clients, {
  bucket, distributionId, filename, content, contentType, cloudfrontFilename, skipInvalidation
}, onEvent) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const actions = [
          await putFile(
            clients, {
              bucket, filename, content, contentType
            },
            onEvent
          )
        ];
        if(!skipInvalidation) {
          actions.push(await invalidateFile(
              clients, {
                filename: cloudfrontFilename || filename, distributionId
              }, onEvent
          ));
        }
        success(onEvent, 'publishFile', `the file was successfully created or modified on s3 bucket${!skipInvalidation ? ' and invalidated on cloudfront': ''}`);
        resolve(actions);
      } catch (err) {
        error(onEvent, 'publishFile', err);
        reject(err);
      }
    })();
  });
}

/**
 * @function publishFiles
 * @param {Object} clients
 * @param {S3} clients.s3
 * @param {CloudFront} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {String[]} options.filenames
 * @param {String[]} options.contents
 * @param {String} options.contentType
 * @param {Boolean} options.skipInvalidation
 * @param {Function} onEvent
 * Create/update and invalidate files for cloudfront deploying.
 */
async function publishFiles(clients, {
  bucket, distributionId, filenames, contents, contentType, skipInvalidation
}, onEvent) {
  try {
    const actions = [
      await Promise.all(filenames.map((filename, index) => putFile(clients, {
        bucket, content: contents[Number(index)], contentType, filename
      }, onEvent)))
    ];
    if(!skipInvalidation) {
      actions.push(await invalidateFiles(
          clients, { distributionId, filenames }, onEvent
      ));
    }
    success(onEvent, 'publishFiles', `the files were successfully created or modified on s3 bucket${!skipInvalidation ? ' and invalidated on cloudfront': ''}`);
    return actions;
  } catch (err) {
    error(onEvent, 'publishFiles', err);
    throw err;
  }
}

/*
 * Exports
 */

module.exports = {
  putFile,
  invalidateFile,
  invalidateFiles,
  publishFile,
  publishFiles,
  listFileVersions,
  enableVersioning,
  rollbackFile
};
