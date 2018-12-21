/*
 * Require
 */

const { publishJson } = require('../');
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
  name: 'testing with a random JSON',
  words: randomWords(30)
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
