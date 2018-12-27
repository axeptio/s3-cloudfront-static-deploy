/*
 * Require
 */
const AWS = require('aws-sdk');

const clients = {
  s3: new AWS.S3(),
  cloudfront: new AWS.CloudFront()
};

const {
  publishFile,
  listFileVersions,
  enableVersioning,
  rollbackFile
} = require('../');

const randomWords = require('random-words');

/*
 * Const
 */
const bucket = process.env.BUCKET_NAME;
const distributionId = process.env.DISTRIBUTION_ID;
const filename = process.env.FILENAME || Date.now().toString() + '.json';
/*
 * Testing API
 */

// Generate Json with random words
const content = JSON.stringify({
  name: 'random JSON',
  words: randomWords(30)
});


// Methods to test
const methods = {
  enableVersioning: false,
  publishFile: true,
  listFileVersions: false,
  rollbackFile: false
};

(async () => {
  try {
    // enableVersioning
    if (methods.enableVersioning) {
      const bucketVersioningResult = await enableVersioning(
        clients,
        { bucket: bucket, isEnabled: true },
        event => {
          console.log(event);
        }
      );
      console.log(bucketVersioningResult);
    }
    // publishFile
    if (methods.publishFile) {
      const publishResult = await publishFile(clients,
        {
          bucket,
          filename,
          distributionId,
          content
        },
        event => {
          console.log(event);
        });
      console.dir(publishResult, { depth: 5 });
    }
    // listFileVersions
    if (methods.listFileVersions) {
      const versionsResult = await listFileVersions(clients, { bucket, filename }, event => {
        console.log(event);
      });
      console.log(versionsResult);
    }

    // rollbackFile
    if (methods.rollbackFile) {
      const rollbackResult = await rollbackFile(
        clients, { bucket, filename, distributionId },
        event => {
          console.log(event);
        }
      );
      console.log(rollbackResult);
    }
  } catch (err) {
    console.log(err.message);
  }
})();
