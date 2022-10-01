import nanoid from 'renderer/utils/nanoid';
import Mark from 'renderer/model/Mark';

export default class Image {
  id: string = nanoid();

  path: string;

  fileName: string;

  height?: number;

  width?: number;

  marks: Mark[] = [];

  metadata?: {
    width: number;
    height: number;
    orientation: number;
  };

  constructor(path: string, fileName: string) {
    this.path = path;
    this.fileName = fileName;
  }
}
