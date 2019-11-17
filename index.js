const fs = require('fs').promises;
const path = require('path');
const _ = require('lodash');

const mkdirIfNotExist = async (dirPath) => {
  try {
    const dirStat = await fs.stat(dirPath);
    if (dirStat.isDirectory()) {
      return;
    }
    fs.mkdir(dirPath);
  } catch (e) {
    fs.mkdir(dirPath);
  }
};

// matcher
const patternMatcher = (pattern) => async (sourcePath) => {
  return pattern.test(sourcePath);
};

// handler
const moveTo = (destPath) => async (sourcePath) => {
  try {
    await mkdirIfNotExist(destPath);
    return await fs.rename(sourcePath, path.join(destPath, sourcePath));
  } catch (e) {
    console.log('handle error: ', e);
  }
};


const rules = [
  {
    matcher: patternMatcher(/\.(js|json)$/),
    handler: moveTo('./codes') 
  },
  {
    matcher: patternMatcher(/^data_\d*_\d*\.csv$/),
    handler: moveTo('./qav-logs') 
  },
  {
    matcher: patternMatcher(/\.(numbers|xls|xlsx|csv)$/),
    handler: moveTo('./tables') 
  },
  {
    matcher: patternMatcher(/\.(jpg|jpeg|png|webp)$/),
    handler: moveTo('./pics') 
  },
  {
    matcher: patternMatcher(/\.(key|ppt|pptx)$/),
    handler: moveTo('./ppts') 
  },
  {
    matcher: patternMatcher(/\.(doc|docx|pdf)$/),
    handler: moveTo('./docs') 
  },
  {
    matcher: patternMatcher(/.*/),
    handler: moveTo('./others') 
  }
];

const run = async () => {
  process.chdir('/Users/LHoin/Desktop');
  const dir = await fs.opendir('./');
  for await (const dirent of dir) {
    for (const rule of rules) {
      console.log(dirent.name);
      if (!dirent.isFile()) {
        continue;
      }
      if (await rule.matcher(dirent.name)) {
        await rule.handler(dirent.name);
      }
    }
  }
};

run();
