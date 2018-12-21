/*
 * Require
 */

const { publishJson } = require('../');
const random = require('slump');

/*
 * Consts
 */

// Rename config.dist.json to config.json and complete it
const { myBucket, filename, distributionId } = require('./config');

/*
 * Testing API
 */

// Generate random Json
const content = JSON.stringify({
  name: 'testing with a random JSON',
  float: random.float(),
  string: random.string()
});

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
