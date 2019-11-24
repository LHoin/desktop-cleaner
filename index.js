const fs = require('fs');
const util = require('util');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const readdir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);

const mkdirIfNotExist = async (dirPath) => {
  try {
    const dirStat = await lstat(dirPath);
    if (dirStat.isDirectory()) {
      return;
    }
    await mkdir(dirPath);
  } catch (e) {
    await mkdir(dirPath);
  }
};

// matcher
const patternMatcher = (pattern) => async (sourcePath) => {
  return pattern.test(sourcePath);
};

// handler
const moveAndClassifyByDate = (destPath) => async (sourcePath, dirent) => {
  try {
    await mkdirIfNotExist(destPath);
    const fileStat = await lstat(sourcePath);
    const modifyDateStr = moment(fileStat.mtimeMs).format('YYYYMMDD');
    const dateDir = path.join(destPath, `/${modifyDateStr}`);
    await mkdirIfNotExist(dateDir);
    console.log(path.join(dateDir, sourcePath));
    await rename(sourcePath, path.join(dateDir, sourcePath));
  } catch (e) {
    console.log('handle error: ', e);
  }
};

const moveTo = (destPath) => async (sourcePath) => {
  try {
    await mkdirIfNotExist(destPath);
    return await rename(sourcePath, path.join(destPath, sourcePath));
  } catch (e) {
    console.log('handle error: ', e);
  }
};

const ignore = async (sourcePath) => {
  console.log('ignore');
};


const rules = [
  {
    matcher: patternMatcher(/^clean$/),
    handler: ignore 
  },
  {
    matcher: patternMatcher(/\.(js|json)$/),
    handler: moveTo('./codes') 
  },
  {
    matcher: patternMatcher(/^data_\d*_\d*\.(csv|numbers)$/),
    handler: moveAndClassifyByDate('./qav-logs') 
  },
  {
    matcher: patternMatcher(/(拉勾招聘|猎聘简历|(前端开发工程师.*\d年))/),
    handler: moveAndClassifyByDate('./cv') 
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
    matcher: patternMatcher(/\.(pages|doc|docx|pdf)$/),
    handler: moveTo('./docs') 
  },
  {
    matcher: patternMatcher(/.*/),
    handler: moveTo('./others') 
  }
];

const run = async () => {
  process.chdir('/Users/LHoin/Desktop');
  const dir = await readdir('./');
  for (const path of dir) {
    for (const rule of rules) {
      const dirent = await lstat(path);
      if (!dirent.isFile()) {
        break;
      }
      if (await rule.matcher(path, dirent)) {
        await rule.handler(path, dirent);
        break;
      }
    }
  }
};

run();
