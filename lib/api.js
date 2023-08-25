const {
  PutObjectCommand,
  ListObjectVersionsCommand,
  PutBucketVersioningCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand
} = require('@aws-sdk/client-s3');
const { GetInvalidationCommand, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { success, error, progress, info, sleep } = require('./functions');

/** @typedef {import('@aws-sdk/client-s3').S3Client} S3Client */
/** @typedef {import('@aws-sdk/client-cloudfront').CloudFrontClient} CloudFrontClient */

/*
 * API
 */
/**
 * @function putFile
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.filename
 * @param {String} options.content
 * @param {String} options.contentType
 * @param {Function} onEvent
 * Create or update a file in a bucket.
 */
async function putFile({ s3 }, { bucket, filename, content, contentType }, onEvent) {
  try {
    const data = await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: content,
        ContentType: contentType
      })
    );
    success(onEvent, 'putFile', 'the file was successfully created or modified on the s3 bucket');
    return data;
  } catch (err) {
    error(onEvent, 'putFile', err);
    throw err;
  }
}

/**
 * @function invalidateFile
 * @param {Object} clients
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {string} options.distributionId
 * @param {string} options.invalidationId
 * @param {Function} onEvent
 * Check the progress of an invalidation request
 */
async function checkInvalidation({ cloudfront }, { distributionId, invalidationId }, onEvent) {
  const check = async () => {
    try {
      const { Invalidation } = await cloudfront.send(
        new GetInvalidationCommand({
          DistributionId: distributionId,
          Id: invalidationId
        })
      );
      if (Invalidation.Status === 'Completed') {
        success(onEvent, 'checkInvalidation');
        return Invalidation;
      } else {
        progress(onEvent, 'checkInvalidation');
        await sleep(2000);
        return check();
      }
    } catch (err) {
      error(onEvent, 'checkInvalidation', err);
      throw new Error(String(err));
    }
  };

  return check();
}

/**
 * @function invalidateFile
 * @param {Object} clients
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {string} options.filename
 * @param {string} options.distributionId
 * @param {Function} onEvent
 * Invalidate file in cloudfront for deploying
 */
async function invalidateFile({ cloudfront }, { filename, distributionId }, onEvent) {
  return invalidateFiles({ cloudfront }, { filenames: [filename], distributionId }, onEvent);
}

/**
 * @function invalidateFiles
 * @param {Object} clients
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {string[]} options.filenames
 * @param {string} options.distributionId
 * @param {Function} onEvent
 * Invalidate files in cloudfront for deploying
 */
async function invalidateFiles({ cloudfront }, { filenames, distributionId }, onEvent) {
  // set unique ID with timestamp
  const method = filenames.length > 1 ? 'invalidateFiles' : 'invalidateFile';
  const timestampId = Date.now().toString();
  try {
    const data = await cloudfront.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: timestampId,
          Paths: {
            Quantity: filenames.length,
            Items: filenames.map(filename => `/${filename}`)
          }
        }
      })
    );
    success(onEvent, method, `the file${filenames.length > 1 ? 's were' : ' was'} successfully invalidated on cloudfront`);
    const results = await checkInvalidation(
      { cloudfront },
      {
        distributionId,
        invalidationId: data.Invalidation.Id
      },
      onEvent
    );
    return results;
  } catch (err) {
    error(onEvent, method, err);
    throw new Error(String(err));
  }
}

/**
 * @function listFileVersions
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.filename
 * @param {Function} onEvent
 * List all versions of a file in a bucket.
 */
async function listFileVersions({ s3 }, { bucket, filename }, onEvent) {
  try {
    const data = await s3.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        Prefix: filename
      })
    );
    info(onEvent, 'listFileVersions', `the versions of the file are: ${data}`);
    return data;
  } catch (err) {
    error(onEvent, 'listFileVersions', err);
    throw err;
  }
}

/**
 * @function enableVersioning
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {Boolean} options.isEnabled
 * @param {Function} onEvent

 * Enabled or suspended versionning of a bucket.
 */
async function enableVersioning({ s3 }, { bucket, isEnabled }, onEvent) {
  const status = isEnabled ? 'Enabled' : 'Suspended';
  try {
    await s3.send(
      new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: {
          Status: status
        }
      })
    );
    info(onEvent, 'enableVersioning', `the versioning of the bucket is in mode ${status}`);
    return { versionningStatus: status };
  } catch (err) {
    error(onEvent, 'enableVersioning', err);
    throw err;
  }
}

/**
 * @function deleteFile
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.filename
 * @param {Function} onEvent
 * Apply deleted mark on a last version of a file in a bucket.
 */
async function deleteFile({ s3 }, { bucket, filename }, onEvent) {
  try {
    const data = await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename }));
    success(onEvent, 'deleteFile', 'the latest version of the file has received the deletion marker');
    return data;
  } catch (err) {
    error(onEvent, 'deleteFile', err);
    throw err;
  }
}

/**
 * @function deleteFiles
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String[]} options.filenames
 * @param {Function} onEvent
 * Apply deleted mark on a last version of files in a bucket.
 */
async function deleteFiles({ s3 }, { bucket, filenames }, onEvent) {
  try {
    const data = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: filenames.map(filename => {
            return { Key: filename };
          })
        }
      })
    );
    success(onEvent, 'deleteFiles', 'the latest version of the files have received the deletion marker');
    return data;
  } catch (err) {
    error(onEvent, 'deleteFiles', err);
    throw err;
  }
}

/**
 * @function rollbackFile
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {Function} onEvent
 * Mark deleted the lasted version of a file in a bucket and invalidate.
 */
async function rollbackFile(clients, { bucket, filename, distributionId }, onEvent) {
  try {
    const actions = [
      await deleteFile(clients, { bucket, filename }, onEvent),
      await invalidateFile(clients, { filename, distributionId }, onEvent)
    ];
    success(
      onEvent,
      'rollbackFile',
      'the latest version of the file received the deletion marker and was invalidated on cloudfront'
    );
    return actions;
  } catch (err) {
    error(onEvent, 'rollbackFile', err);
    throw err;
  }
}

/**
 * @function rollbackFiles
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {String[]} options.filenames
 * @param {Function} onEvent
 * @param {Function} onEvent
 * Mark deleted the lasted version of a file in a bucket and invalidate.
 */
async function rollbackFiles(clients, { bucket, filenames, distributionId }, onEvent) {
  try {
    const actions = [
      await deleteFiles(clients, { bucket, filenames }, onEvent),
      await invalidateFiles(clients, { distributionId, filenames }, onEvent)
    ];
    success(
      onEvent,
      'rollbackFiles',
      'the latest version of the files received the deletion marker and were invalidated on cloudfront'
    );
    return actions;
  } catch (err) {
    error(onEvent, 'rollbackFiles', err);
    throw err;
  }
}

/**
 * @function publishFile
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {CloudFrontClient} clients.cloudfront
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
async function publishFile(
  clients,
  { bucket, distributionId, filename, content, contentType, cloudfrontFilename, skipInvalidation },
  onEvent
) {
  try {
    const actions = [
      await putFile(
        clients,
        {
          bucket,
          filename,
          content,
          contentType
        },
        onEvent
      )
    ];
    if (!skipInvalidation) {
      actions.push(
        await invalidateFile(
          clients,
          {
            filename: cloudfrontFilename || filename,
            distributionId
          },
          onEvent
        )
      );
    }
    success(
      onEvent,
      'publishFile',
      `the file was successfully created or modified on s3 bucket${!skipInvalidation ? ' and invalidated on cloudfront' : ''}`
    );
    return actions;
  } catch (err) {
    error(onEvent, 'publishFile', err);
    throw err;
  }
}

/**
 * @function publishFiles
 * @param {Object} clients
 * @param {S3Client} clients.s3
 * @param {CloudFrontClient} clients.cloudfront
 * @param {Object} options
 * @param {String} options.bucket
 * @param {String} options.distributionId
 * @param {String[]} options.filenames
 * @param {String[]} options.cloudfrontFilenames
 * @param {String[]} options.contents
 * @param {String} options.contentType
 * @param {Boolean} options.skipInvalidation
 * @param {Function} onEvent
 * Create/update and invalidate files for cloudfront deploying.
 */
async function publishFiles(
  clients,
  { bucket, distributionId, filenames, contents, contentType, cloudfrontFilenames, skipInvalidation },
  onEvent
) {
  try {
    const actions = [
      await Promise.all(
        filenames.map((filename, index) =>
          putFile(
            clients,
            {
              bucket,
              content: contents[Number(index)],
              contentType,
              filename
            },
            onEvent
          )
        )
      )
    ];
    if (!skipInvalidation) {
      actions.push(await invalidateFiles(clients, { distributionId, filenames: cloudfrontFilenames || filenames }, onEvent));
    }
    success(
      onEvent,
      'publishFiles',
      `the files were successfully created or modified on s3 bucket${!skipInvalidation ? ' and invalidated on cloudfront' : ''}`
    );
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
  rollbackFile,
  rollbackFiles,
  deleteFile,
  deleteFiles
};
