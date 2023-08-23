require('dotenv').config();
const { CloudFrontClient } = require('@aws-sdk/client-cloudfront');
const { S3Client } = require('@aws-sdk/client-s3');

const { publishFile, publishFiles, listFileVersions, enableVersioning, rollbackFile, rollbackFiles } = require('../lib/api');

const randomWords = require('random-words');

const bucket = process.env.BUCKET_NAME;
const distributionId = process.env.DISTRIBUTION_ID;
const filename = process.env.FILENAME || `${process.env.FILENAME_PREFIX ?? ''}${new Date().toISOString()}_1.json`;
const filename2 = `${process.env.FILENAME_PREFIX ?? ''}${new Date().toISOString()}_2.json`;

const region = process.env.REGION;
const config = region ? { region } : {};
const clients = {
  s3: new S3Client(config),
  cloudfront: new CloudFrontClient(config)
};
/*
 * Testing API
 */

// Generate Json with random words
const content = JSON.stringify({
  name: 'random JSON',
  words: randomWords(30)
});

const content2 = JSON.stringify({
  name: 'random JSON',
  words: randomWords(30)
});

// Methods to test
const methods = {
  enableVersioning: false,
  publishFile: true,
  publishFiles: true,
  listFileVersions: true,
  rollbackFile: false,
  rollbackFiles: true
};

(async () => {
  try {
    // enableVersioning
    if (methods.enableVersioning) {
      const bucketVersioningResult = await enableVersioning(clients, { bucket, isEnabled: true }, event => {
        console.log(event);
      });
      console.log(bucketVersioningResult);
    }
    // publishFile
    if (methods.publishFile) {
      const publishResult = await publishFile(
        clients,
        {
          bucket,
          filename,
          distributionId,
          content
        },
        event => {
          console.log(event);
        }
      );
      console.dir(publishResult, { depth: 5 });
    }
    // publishFiles
    if (methods.publishFiles) {
      const publishResult = await publishFiles(
        clients,
        {
          bucket,
          filenames: [filename, filename2],
          distributionId,
          contents: [content, content2]
        },
        event => {
          console.log(event);
        }
      );
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
      const rollbackResult = await rollbackFile(clients, { bucket, filename, distributionId }, event => {
        console.log(event);
      });
      console.log(rollbackResult);
    }

    // rollbackFiles
    if (methods.rollbackFiles) {
      const rollbackResult = await rollbackFiles(clients, { bucket, filenames: [filename, filename2], distributionId }, event => {
        console.log(event);
      });
      console.log(rollbackResult);
    }
  } catch (err) {
    console.log(err.message);
  }
})();
