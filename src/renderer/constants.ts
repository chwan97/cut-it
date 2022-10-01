export enum QuitDialogType {
  common,
  cut,
}

export const MINIMAL_OUTPUT_IMAGE_SIZE_LIMIT = 20;

export const SYSTEM_IMAGE_SIZE_LIMIT = 20;

export enum ExifOrientation {
  // 正
  normal = 1,
  // 逆时针90度
  eastern90deg = 6,
  // 顺时针90度
  clockwise90deg = 8,
  // 顺时针180度
  clockwise180deg = 3,
}
