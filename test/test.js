/*
 * Require
 */

const content = require('./test');
const { publishJson } = require('../');

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
    let publishResult = await publishJson(myBucket, filename, distributionId, content, event => {
      console.log(event);
    });
    console.dir(publishResult, { depth: 5 });
  } catch (err) {
    console.log(err.message);
  }
})();
