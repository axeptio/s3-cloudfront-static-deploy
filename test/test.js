/*
 * Require
 */

const {
  publishFile,
  listFileVersions,
  enableVersioning,
  rollbackFile
} = require('../');
const randomWords = require('random-words');

/*
 * Consts
 */

// Rename config.dist.json to config.json and complete it
const { myBucket, filename, distributionId } = require('./config');

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
  publishFile: true,
  enableVersioning: true,
  listFileVersions: true,
  rollbackFile: true
};

(async () => {
  try {
    if (methods.publishFile) {
      const publishResult = await publishFile(
        myBucket,
        filename,
        distributionId,
        content,
        event => {
          console.log(event);
        }
      );
      console.dir(publishResult, { depth: 5 });
    }

    if (methods.enableVersioning) {
      const bucketVersioningResult = await enableVersioning(myBucket, true, event => {
        console.log(event);
      });
      console.log(bucketVersioningResult);
    }

    if (methods.listFileVersions) {
      const versionsResult = await listFileVersions(myBucket, filename, event => {
        console.log(event);
      });
      console.log(versionsResult);
    }

    if (methods.rollbackFile) {
      const rollbackResult = await rollbackFile(myBucket, filename, event => {
        console.log(event);
      });
      console.log(rollbackResult);
    }
  } catch (err) {
    console.log(err.message);
  }
})();
