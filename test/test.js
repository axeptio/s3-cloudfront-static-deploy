/*
 * Require
 */
const content = require('./test');
const { publishFile } = require('../s3-cloudfront-static-deploy');

/*
 * Consts
 */
// Rename config.dist.json to config.json and complete it
const { myBucket, filename, distributionId } = require('./config');

/*
 * Testing API
 */
(async () => {
  try {
    let publishResult = await publishFile(myBucket, filename, distributionId, content, event => {
      console.log(event);
    });
    console.log(publishResult);
  } catch (err) {
    console.log(err.message);
  }
})();
