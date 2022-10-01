import { readdir, rename } from 'fs/promises';
import sharp from 'sharp';
import path from 'path';
import hasha from 'hasha';
import Image from 'renderer/model/Image';
import naturalCompare from 'natural-compare-lite';
import { clamp, floor, isNil, ceil } from 'lodash';
import log from 'renderer/utils/logger';
import getMacAddress from './getMacAddress';
import { ExifOrientation } from 'renderer/constants';

sharp.cache(false);

const allowImageExt = '.jpg/.JPG/.jpeg/.JPEG/.png/.PNG'.split('/');

export const clampAndFloor8 = (
  number: number,
  lower: number,
  upper: number
): number => {
  return floor(clamp(ceil(number, 2), lower, floor(upper, 2)), 8);
};

export const floor2 = (number: number): number => {
  return floor(number, 2);
};

export const getNameWithoutExt = (fileName: string) => {
  if (fileName.indexOf('.') === -1) {
    return fileName;
  }
  const newPathSplit = fileName.split('.');
  let newName = fileName;
  if (newPathSplit?.length) {
    newPathSplit.pop();
    newName = newPathSplit.join('.');
  }
  return newName;
};

export const getLastDir = (dir: string) => {
  return path.basename(dir);
};

const fillSizeInfo = async (images: any) => {
  for (const image of images) {
    const imagePath = image.path;
    const imageInstance = sharp(imagePath);
    const metadata = await imageInstance.metadata();
    // log.info('获取文件列表metadata', metadata);

    image.metadata = {
      width: metadata?.width,
      height: metadata?.height,
      orientation: metadata?.orientation,
    };
  }
};

export const getImageWithMetaInfo = async (imgPath: string) => {
  const imageInstance = new Image(imgPath, path.basename(imgPath));
  await fillSizeInfo([imageInstance]);
  return imageInstance;
};

export const getDirImages = async (
  dir: string,
  { withFill }: { withFill?: boolean } = {}
): Promise<Image[]> => {
  try {
    const files = await readdir(dir);
    files.sort(naturalCompare);
    const fileAfterFilter = files
      .filter((fileName: string) => {
        return allowImageExt.some(
          (allowExt) => path.extname(fileName) === allowExt
        );
      })
      .map((fileName: string) => {
        return new Image(path.join(dir, fileName), fileName);
      });

    if (withFill) {
      await fillSizeInfo(fileAfterFilter);
    }
    log.info('获取文件列表', dir, withFill, fileAfterFilter);
    return fileAfterFilter;
  } catch (err) {
    console.error(err);
  }
  return [];
};

export const imageIdBuilder = (index: number): string => `image-${index}`;

// 机器mac -> hash:4
export const hashMaker = (): Promise<string> =>
  getMacAddress().then(({ physicals, virtual }) => {
    log.info('mac 地址：', physicals, virtual);
    if (physicals?.[0]) {
      const hashStr = hasha(physicals?.[0]);
      if (!hashStr) {
        throw new Error('mac地址获取失败');
      }
      return hashStr.slice(0, 4);
    }
    throw new Error('mac地址获取失败');
  });

const newNameBuilder = (filePath: string, ext: string) => {
  let newPathSplit = path.basename(filePath).split('.');
  if (newPathSplit?.length) {
    newPathSplit = newPathSplit.filter((_, index: number) => {
      return index < newPathSplit.length - 1;
    });
    const newPath = newPathSplit.join('.');
    return path.join(path.dirname(filePath), `${newPath}.${ext}`);
  }
  return null;
};

export const checkAndRenameExt = async (filePath: string) => {
  const extName = path.extname(filePath);
  if (extName === '.PNG') {
    const newPathName = newNameBuilder(filePath, 'png');
    if (newPathName) {
      await rename(filePath, newPathName);
    }
    return;
  }
  if ('.JPG/.jpeg/.JPEG'.indexOf(extName) > -1) {
    const newPathName = newNameBuilder(filePath, 'jpg');
    if (newPathName) {
      await rename(filePath, newPathName);
    }
  }
};

export const normalizationImageExtName = async (dir: string) => {
  const images = await getDirImages(dir, { withFill: false });
  for (const image of images) {
    await checkAndRenameExt(image.path);
  }
};

export const cutResultNameBuilder = (
  _deviceId: string,
  _optDate: string,
  photoId: string,
  cutIndex: number,
  extname: string,
  imageMarksNum: number
) => {
  if (imageMarksNum === 1) {
    return `${photoId}${extname}`;
  }
  return `${photoId}_${cutIndex + 1}${extname}`;
};

export const testFileSizeDivide16Wrong = (images: any[]): Image[] => {
  const wrongImages: Image[] = [];
  images.forEach((image: Image) => {
    const { width, height } = image.metadata || {};
    if (!width || !height) {
      wrongImages.push(image);
      return;
    }
    if (width % 16 !== 0 || height % 16 !== 0) {
      wrongImages.push(image);
    }
  });

  return wrongImages;
};

export const testFileNameReturnFirstWrong = (images: any[]): Image | null => {
  const index = images.findIndex((image: Image) => {
    // 数字、字母”及以下字符“_”、“#”、“$”
    return !/^[a-zA-Z0-9_#$]+\.[a-zA-Z]+$/.test(image.fileName);
  });
  if (index !== -1) {
    return images[index];
  }
  return null;
};

export const testFileExistInAllDir = (
  mainDirImages: any[],
  testDirsImages: any[][],
  testDirs: string[]
) => {
  const mainDirMap = new Map();
  const testDirsMaps = new Array(testDirsImages.length)
    .fill('')
    .map(() => new Map());
  mainDirImages.forEach((item: Image) => {
    mainDirMap.set(getNameWithoutExt(item.fileName), item);
  });

  testDirsImages.forEach((images: Image[], index) => {
    images.forEach((item: Image) => {
      testDirsMaps[index].set(getNameWithoutExt(item.fileName), item);
    });
  });
  const unFindDirNames: string[] = [];
  const index = mainDirImages.findIndex((image: Image) => {
    let isMatch = false;
    testDirsMaps.forEach((map, mapIndex) => {
      const file = map.get(getNameWithoutExt(image.fileName));
      if (!file) {
        isMatch = true;
        unFindDirNames.push(`副文件夹${mapIndex + 1}：${testDirs[mapIndex]}`);
      }
    });

    return isMatch;
  });
  if (index !== -1) {
    return {
      file: mainDirImages[index],
      unFindDirNames,
    };
  }
  return null;
};

export function getNaturalWAndH(image: Image) {
  if (!image || !image.metadata) {
    return [undefined, undefined];
  }

  const mainMeta = image.metadata;
  const mianOriginalHeight = mainMeta?.height;
  const minaOriginalWidth = mainMeta?.width;
  let mianHeight = mianOriginalHeight;
  let minaWidth = minaOriginalWidth;
  const mianOrientation = mainMeta?.orientation;
  if (
    mianOrientation === ExifOrientation.eastern90deg ||
    mianOrientation === ExifOrientation.clockwise90deg
  ) {
    mianHeight = minaOriginalWidth;
    minaWidth = mianOriginalHeight;
  }
  return [minaWidth, mianHeight];
}

export const testFileHeightAndWidth = async (
  mainDirImages: any[],
  testDirsImages: any[][],
  testDirs: string[],
  mainDir: string
) => {
  const testDirImages: any[] = [];
  testDirsImages.forEach((item) => {
    testDirImages.push(...item);
  });

  const mainDirMap = new Map();
  const testDirsMaps = new Array(testDirsImages.length)
    .fill('')
    .map(() => new Map());
  mainDirImages.forEach((item: Image) => {
    mainDirMap.set(getNameWithoutExt(item.fileName), item);
  });

  testDirsImages.forEach((images: Image[], index) => {
    images.forEach((item: Image) => {
      testDirsMaps[index].set(getNameWithoutExt(item.fileName), item);
    });
  });
  const wrongSizeImages: string[] = [];
  const index = mainDirImages.findIndex((image: Image) => {
    const mainMeta = image.metadata;

    if (!mainMeta || isNil(mainMeta.height) || isNil(mainMeta.width)) {
      wrongSizeImages.push(`主文件夹图片信息读取失败：${mainDir}`);
      return true;
    }
    const [mainWidth, mianHeight] = getNaturalWAndH(image);

    let isMatch = false;
    testDirsMaps.forEach((map, mapIndex) => {
      const file = map.get(getNameWithoutExt(image.fileName));
      if (
        !file ||
        !file.metadata ||
        isNil(file.metadata.width) ||
        isNil(file.metadata.height)
      ) {
        wrongSizeImages.push(
          `副文件夹${mapIndex + 1}宽高信息读取失败：${testDirs[mapIndex]}`
        );
        isMatch = true;
        return;
      }
      const [testWidth, testHeight] = getNaturalWAndH(file);
      if (testWidth !== mainWidth || mianHeight !== testHeight) {
        wrongSizeImages.push(`副文件夹${mapIndex + 1}：${testDirs[mapIndex]}`);
        isMatch = true;
      }
    });

    return isMatch;
  });
  if (index !== -1) {
    return {
      file: mainDirImages[index],
      wrongSizeImages,
    };
  }
  return null;
};

const LIMIT_PARALLEL_NUM = 500;
let currentRunningTaskNum = 0;
const taskQueue: any[] = [];

const check = () => {
  if (taskQueue?.length) {
    const resolve = taskQueue.shift();
    resolve();
  }
};

export const shapeDealWithParallel = async (executor: () => Promise<any>) => {
  if (currentRunningTaskNum < LIMIT_PARALLEL_NUM) {
    currentRunningTaskNum += 1;
    executor()
      .then((data) => {
        currentRunningTaskNum -= 1;
        check();
        return data;
      })
      .catch(() => {
        check();
      });
  } else {
    await new Promise((resolve) => {
      taskQueue.push(resolve);
    });
    currentRunningTaskNum += 1;
    executor()
      .then((data) => {
        currentRunningTaskNum -= 1;
        check();
        return data;
      })
      .catch(() => {
        check();
      });
  }
};

export const cutImage = async (
  filePath: string,
  image: Image,
  alterImage: Image,
  deviceId: string,
  optDate: string
) => {
  log.info('裁剪任务：', {
    alterImage,
    image,
  });
  const photoId = getNameWithoutExt(image.fileName);
  if (isNil(alterImage?.path) || isNil(image?.marks)) {
    return;
  }
  const imageMarks = image.marks;
  let index = 0;
  const shapeInstance = await sharp(alterImage.path).withMetadata();

  const extname = path.extname(alterImage.path);
  const [width, height] = getNaturalWAndH(alterImage);
  // const { width, height } = alterImage.metadata || {};
  for (const imageMark of imageMarks) {
    const { top, left } = imageMark.beginPointPercent || {};
    if (
      isNil(imageMark.heightPercent) ||
      isNil(imageMark.widthPercent) ||
      isNil(height) ||
      isNil(width) ||
      isNil(top) ||
      isNil(left)
    ) {
      log.error('裁剪错误，没有获取到标记信息', {
        height,
        width,
        top,
        left,
        heightPercent: imageMark.heightPercent,
        widthPercent: imageMark.widthPercent,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    let markHeight = Math.floor(imageMark.heightPercent * height);
    let markWidth = Math.floor(imageMark.widthPercent * width);
    let markTop = Math.floor(height * top);
    let markLeft = Math.floor(width * left);
    // 如果方向是旋转后的的 长 宽 对换， 起点需要重新计算
    if (alterImage.metadata?.orientation) {
      if (
        alterImage.metadata?.orientation === ExifOrientation.eastern90deg ||
        alterImage.metadata?.orientation === ExifOrientation.clockwise90deg
      ) {
        const temp = markHeight;
        markHeight = markWidth;
        markWidth = temp;
      }
      if (alterImage.metadata?.orientation === ExifOrientation.eastern90deg) {
        const markLeftCopy = markLeft;
        markLeft = markTop;
        markTop = height - markLeftCopy - markHeight;
      }
      if (alterImage.metadata?.orientation === ExifOrientation.clockwise90deg) {
        const markTopCopy = markTop;
        markTop = markLeft;
        markLeft = width - markTopCopy - markHeight;
      }
      if (
        alterImage.metadata?.orientation === ExifOrientation.clockwise180deg
      ) {
        const markTopCopy = markTop;
        const markLeftCopy = markLeft;
        markTop = height - markTopCopy - markHeight;
        markLeft = width - markLeftCopy - markWidth;
      }
    }
    const outPutFileName = cutResultNameBuilder(
      deviceId,
      optDate,
      photoId,
      index,
      extname,
      imageMarks.length
    );
    if (
      !isNil(markLeft) &&
      !isNil(markTop) &&
      !isNil(markWidth) &&
      !isNil(markHeight)
    ) {
      if (markLeft < 0) {
        markLeft = 0;
        log.error('left 0');
      }
      if (markTop < 0) {
        markTop = 0;
        log.error('top 0');
      }
      await shapeDealWithParallel(() => {
        log.info('生成裁剪文件：', {
          left: markLeft,
          top: markTop,
          width: markWidth,
          height: markHeight,
          outPutFileName,
          filePath,
        });
        return shapeInstance
          .extract({
            left: markLeft,
            top: markTop,
            width: markWidth,
            height: markHeight,
          })
          .toFile(path.join(filePath, outPutFileName));
      });
    } else {
      log.error('裁剪错误，没有获取到处理后标记信息', {
        left: markLeft,
        top: markTop,
        width: markWidth,
        height: markHeight,
        outPutFileName,
        filePath,
      });
    }
    index += 1;
  }
};

export const getFatherDirOrItSelf = (dir: string) => {
  if (dir.indexOf('/') === -1 && dir.indexOf('\\') === -1) return dir;
  return path.resolve(dir, '..');
};

export const encodePath = (url: string) => {
  if (process.platform !== 'darwin') {
    return url
      .split(path.sep)
      .map((item, index) => {
        if (index === 0) {
          return item;
        }
        return encodeURIComponent(item);
      })
      .join(path.sep);
  }
  return url
    .split(path.sep)
    .map((item) => encodeURIComponent(item))
    .join(path.sep);
};
