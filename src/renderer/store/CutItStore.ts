import { shell, ipcRenderer } from 'electron';
import { makeAutoObservable, toJS } from 'mobx';
import dayjs from 'dayjs';
import fse from 'fs-extra';
import path from 'path';
import SwiperCore from 'swiper';
import { debounce, isNil } from 'lodash';

import {
  cutImage,
  getDirImages,
  getImageWithMetaInfo,
  checkAndRenameExt,
  imageIdBuilder,
  clampAndFloor8,
} from 'renderer/utils';
import Mark from 'renderer/model/Mark';
import log from 'renderer/utils/logger';
import { SYSTEM_IMAGE_SIZE_LIMIT } from 'renderer/constants';
import Image from 'renderer/model/Image';

const INIT_INDEX = 0;

let indexSeed = 0;

export default class CutItStore {
  main: any;

  initialIndex = INIT_INDEX;

  activeIndex = INIT_INDEX;

  resultTipsVisible = false;

  hotAreaPosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  } = { top: 10000, left: 0, width: 0, height: 0 };

  selectedMark: any[] = [];

  selectedIndex: number = -1;

  lastTargetDir = '';

  dir: string = '';

  images: Image[] = [];

  swiperRef: SwiperCore | null = null;

  cutProgressVisible = false;

  totalCutNum = 0;

  currentCutNum = 0;

  constructor(main: any) {
    makeAutoObservable(this);
    this.main = main;
  }

  forceUpdate = debounce(() => {
    this.swiperRef?.update();
    this.swiperRef?.virtual?.update?.(true);
    this.clearSelectedMark();
    this.refreshPositionByIndex(this.activeIndex);
  }, 300);

  onResize = () => {
    this.forceUpdate();
  };

  superFill = () => {
    this.images.forEach((item) => {
      const newMark = new Mark({
        beginPointPercent: {
          top: 0.25,
          left: 0.25,
        },

        heightPercent: 0.5,
        widthPercent: 0.5,
      });
      item.marks.push(newMark);
    });
    this.forceUpdate();
  };

  startFromOneImage = async () => {
    const imgPath = await this.selectImage();
    if (imgPath) {
      this.dir = path.dirname(imgPath);
      const imageInstance = await getImageWithMetaInfo(imgPath);
      this.images = [imageInstance];
      await this.preCheck();
    }
  };

  startFromDir = async () => {
    const dir = await this.selectDir();
    if (dir) {
      this.dir = dir;
      this.images = await getDirImages(dir, { withFill: true });
      await this.preCheck();
    }
  };

  preCheck = async () => {
    const { images, dir } = this;
    console.log('images, dir', images, dir);
    if (!images[0] || !dir) {
      this.main.warningFn('没有找到待裁剪图片');
      return;
    }

    for (const image of images) {
      await checkAndRenameExt(image.path);
    }

    // 确保尺寸信息存在
    const isAllImageHaveSizeInfo = images.every(
      (image) => !isNil(image.metadata?.width) && !isNil(image.metadata?.height)
    );

    if (!isAllImageHaveSizeInfo) {
      this.main.warningFn('存在图片尺寸信息读取失败，无法进行下一步。');
      return;
    }

    await this.init();
    this.main.navigate?.('/cut-it');
  };

  commonSelect =
    (ipcKey: string) =>
    (errorTips: string) =>
    async (fileDir: string = this.main.desktopDir) => {
      this.main.display.setGlobalLoading(true, '正在拉起系统文件选择框');
      let result: null | string = null;
      await ipcRenderer
        .invoke(ipcKey, fileDir)
        .then(async ({ filePaths }: any) => {
          const newFileDir = filePaths?.[0] as string;

          if (!newFileDir) {
            throw new Error(errorTips);
          }

          result = newFileDir;
        })
        .finally(() => {
          this.main.display.setGlobalLoading(false);
        })
        .catch((e: Error) => {
          console.error(e);
        });
      return result;
    };

  selectImage = this.commonSelect('selectImage')('请选择一张图片！');

  selectDir = this.commonSelect('selectDirs')('请选择一个文件夹！');

  init = async () => {
    if (!this.dir) {
      // console.log('fire', this.main.navigate);
      setTimeout(() => {
        this.main.navigate?.('/');
      });
      return;
    }
    this.activeIndex = INIT_INDEX;
    await this.main.checkAndRefresh();
  };

  slideTo = (index: number) => {
    this.swiperRef?.slideTo(index, 300);
    this.forceUpdate();
  };

  startCut = async () => {
    // 检测是否所有的图片 是否都有标记 没有就定位到没有标记那个提示
    const noMarkIndex = this.images.findIndex((image: Image) => {
      if (!image.marks?.length) {
        return true;
      }
      return false;
    });
    if (noMarkIndex > -1) {
      this.swiperRef?.slideTo(noMarkIndex, 300);
      this.forceUpdate();
      this.main.warningFn(
        '请前往标注裁剪框',
        `第${noMarkIndex + 1}张照片未标注裁剪框`
      );
      return;
    }

    if (this.main.macAddressGotError) {
      const success = await this.main.checkAndRefresh();
      if (!success) {
        this.main.warningFn('没有获取到机器码，裁剪无法进行');
        return;
      }
    }

    // 创建裁剪结果文件夹 检查当前文件夹
    const fDir = this.dir;
    const optTime = dayjs().format('YYYY-MM-DD-HH-mm-ss');
    this.lastTargetDir = path.join(fDir, `cut-it-result${optTime}`);

    this.currentCutNum = 0;
    this.totalCutNum = this.images.length;
    this.cutProgressVisible = true;

    const targetDir = this.lastTargetDir;
    try {
      await fse.remove(targetDir);
    } catch (e) {
      log.error('移除老的裁剪结果：', e);
      console.error(e);
    }
    await fse.ensureDir(targetDir);

    for (const image of this.images) {
      try {
        await cutImage(
          targetDir,
          image,
          image,
          this.main.macAddressHash,
          optTime
        );
      } catch (e) {
        log.error('裁剪失败', e);
      } finally {
        // this.currentCutNum += image.marks.length;
        this.currentCutNum += 1;
        console.log('this.currentCutNum', this.currentCutNum);
      }
    }

    setTimeout(() => {
      this.cutProgressVisible = false;
      this.resultTipsVisible = true;
    }, 2 * 1000);
  };

  openTargetDir = () => {
    shell.openPath(this.lastTargetDir);
    this.resultTipsVisible = false;
  };

  closeTips = () => {
    this.resultTipsVisible = false;
  };

  getIndexById = (id: string) => {
    return this.images[this.activeIndex].marks.findIndex((item) => {
      return item.id === id;
    });
  };

  addMarkRaw = ({
    top,
    left,
    bottom,
    right,
  }: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  }) => {
    const newTop = clampAndFloor8(
      top,
      this.hotAreaPosition.top,
      this.hotAreaPosition.top + this.hotAreaPosition.height
    );
    const newBottom = clampAndFloor8(
      bottom,
      this.hotAreaPosition.top,
      this.hotAreaPosition.top + this.hotAreaPosition.height
    );
    const newLeft = clampAndFloor8(
      left,
      this.hotAreaPosition.left,
      this.hotAreaPosition.left + this.hotAreaPosition.width
    );
    const newRight = clampAndFloor8(
      right,
      this.hotAreaPosition.left,
      this.hotAreaPosition.left + this.hotAreaPosition.width
    );

    const newHeight = Math.floor(newBottom - newTop);
    const newWidth = Math.floor(newRight - newLeft);
    // 不超过 300 不生成选择框
    const { height: imageHeight, width: imageWidth } =
      this.images[this.activeIndex].metadata || {};
    // imageWidth 为空不添加符合正常逻辑
    const limitWidth =
      (SYSTEM_IMAGE_SIZE_LIMIT / imageWidth!) * this.hotAreaPosition.width;
    const limitHeight =
      (SYSTEM_IMAGE_SIZE_LIMIT / imageHeight!) * this.hotAreaPosition.height;
    if (newHeight > limitHeight && newWidth > limitWidth) {
      this.addMark({
        top: newTop - this.hotAreaPosition.top,
        left: newLeft - this.hotAreaPosition.left,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  addMark = ({
    top,
    left,
    width,
    height,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => {
    const { width: containerWidth, height: containerHeight } =
      this.hotAreaPosition;
    const newMark = new Mark({
      beginPointNumber: {
        top,
        left,
      },
      widthNumber: width,
      heightNumber: height,
      heightPercent: height / containerHeight,
      widthPercent: width / containerWidth,
      beginPointPercent: {
        top: top / containerHeight,
        left: left / containerWidth,
      },
    });
    this.images[this.activeIndex].marks = [
      ...this.images[this.activeIndex].marks,
      newMark,
    ];
    this.images = [...this.images];
    setTimeout(() => {
      this.setSelectedMarkById(newMark.id || '');
    });
  };

  removeEleMarkById = (id: string) => {
    if (!id) return;
    const newMarks = this.images[this.activeIndex].marks.filter((item) => {
      return id !== item.id;
    });
    this.images[this.activeIndex].marks = newMarks;
    this.clearSelectedMark();
    // if (this.images[this.activeIndex].marks[0]?.id) {
    //   this.setSelectedMarkById(this.images[this.activeIndex].marks[0].id || '');
    // } else {
    //   this.clearSelectedMark();
    // }
  };

  clearSelectedMark = () => {
    this.selectedMark = [];
  };

  setSelectedMarkById = (id: string) => {
    if (!id) {
      return;
    }
    const ele = document.getElementById(id);
    const eleIndex = this.images[this.activeIndex].marks.findIndex((item) => {
      return item.id === id;
    });
    if (ele && eleIndex !== -1) {
      this.selectedMark = [document.getElementById(id)];
      this.selectedIndex = eleIndex;
      indexSeed += 1;
      this.images[this.activeIndex].marks[eleIndex].zIndex = indexSeed;
      this.images[this.activeIndex].marks = [
        ...this.images[this.activeIndex].marks,
      ];
    }
  };

  updateMarkById = (
    id: string,
    position: {
      width?: number;
      height?: number;
      top: number;
      left: number;
    }
  ) => {
    const { top: pTop, left: pLeft, width: pWidth, height: pHeight } = position;
    const eleIndex = this.images[this.activeIndex].marks.findIndex((item) => {
      return item.id === id;
    });

    if (eleIndex >= 0 && pTop !== undefined && pLeft !== undefined) {
      const { widthNumber = 0, heightNumber = 0 } =
        this.images[this.activeIndex].marks[eleIndex];
      const { width: containerWidth, height: containerHeight } =
        this.hotAreaPosition;

      const newTop = clampAndFloor8(pTop, 0, containerHeight);
      const newLeft = clampAndFloor8(pLeft, 0, containerWidth);
      let newWidth = widthNumber;
      let newHeight = heightNumber;
      // console.log('pWidth , pHeight:', pWidth, pHeight);
      log.info('选区更新', {
        pTop,
        pLeft,
        pWidth,
        pHeight,
        containerWidth,
        containerHeight,
      });
      if (pWidth !== undefined && pHeight !== undefined) {
        newWidth = clampAndFloor8(pWidth, 30, containerWidth);
        newHeight = clampAndFloor8(pHeight, 30, containerHeight);
      }
      const markAfterUpdate = {
        beginPointNumber: {
          top: newTop,
          left: newLeft,
        },
        widthNumber: newWidth,
        heightNumber: newHeight,
        heightPercent: newHeight / containerHeight,
        widthPercent: newWidth / containerWidth,
        beginPointPercent: {
          top: newTop / containerHeight,
          left: newLeft / containerWidth,
        },
      };
      // console.log('markAfterUpdate', markAfterUpdate);
      this.images[this.activeIndex].marks[eleIndex] = {
        ...this.images[this.activeIndex].marks[eleIndex],
        ...markAfterUpdate,
      };
      this.images[this.activeIndex].marks = [
        ...this.images[this.activeIndex].marks,
      ];
      this.images = [...this.images];
    }
    console.log(
      'this.images[this.activeIndex].marks[eleIndex]',
      toJS(this.images[this.activeIndex].marks[eleIndex])
    );
  };

  setSwiperRef = (swiperRef: SwiperCore) => {
    this.swiperRef = swiperRef;
  };

  setActiveIndex = (index: number) => {
    this.activeIndex = index;
  };

  setHotAreaPosition = ({
    top,
    left,
    width,
    height,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => {
    this.hotAreaPosition.top = top;
    this.hotAreaPosition.left = left;
    this.hotAreaPosition.width = width;
    this.hotAreaPosition.height = height;
  };

  refreshMarkPosition = () => {
    const { width: containerWidth, height: containerHeight } =
      this.hotAreaPosition;
    console.log('this.images', this.images);

    const newMark = this.images[this.activeIndex].marks.map((item) => {
      const {
        id,
        widthPercent = 0.2,
        heightPercent = 0.2,
        beginPointPercent = {
          top: 0.2,
          left: 0.2,
        },
      } = item;
      const { top: pTop, left: pLeft } = beginPointPercent;

      const newWidth = clampAndFloor8(
        widthPercent * containerWidth,
        30,
        containerWidth
      );
      const newHeight: number = clampAndFloor8(
        heightPercent * containerHeight,
        30,
        containerHeight
      );
      const newTop = clampAndFloor8(
        pTop * containerHeight,
        0,
        containerHeight - newHeight
      );
      const newLeft = clampAndFloor8(
        pLeft * containerWidth,
        0,
        containerWidth - newWidth
      );
      const ele = document.getElementById(id || '');
      if (ele) {
        ele.style.width = `${newWidth}px`;
        ele.style.height = `${newHeight}px`;
        ele.style.transform = `translate(${newLeft}px, ${newTop}px)`;
      }

      return {
        ...toJS(item),
        beginPointNumber: {
          top: newTop,
          left: newLeft,
        },
        widthNumber: newWidth,
        heightNumber: newHeight,
      };
    });
    console.log(
      'newMark after resize deal: containerWidth, containerHeight',
      toJS(newMark),
      containerWidth,
      containerHeight
    );
    this.images[this.activeIndex].marks = newMark;
  };

  refreshPositionByIndex = (index: number) => {
    const activeEleId = imageIdBuilder(index);
    const ele = document.getElementById(activeEleId);

    const { top, left, width, height } = ele?.getBoundingClientRect() || {};

    // console.log(
    //   { top, left, width, height },
    //   'active ele',
    //   'activeEleId',
    //   activeEleId
    // );

    if (top && left && width && height) {
      this.setHotAreaPosition({
        top,
        left,
        width,
        height,
      });
      this.refreshMarkPosition();
    }
  };
}
