import nanoid from 'renderer/utils/nanoid';
import Point from 'renderer/model/Point';

export default class Mark {
  id?: string = nanoid();

  beginPointPercent?: Point;

  beginPointNumber?: Point;

  heightPercent?: number;

  widthPercent?: number;

  heightNumber?: number;

  widthNumber?: number;

  zIndex?: number = 0;

  constructor(props: Mark) {
    const {
      beginPointPercent,
      beginPointNumber,
      heightPercent,
      widthPercent,
      heightNumber,
      widthNumber,
    } = props;
    this.beginPointPercent = beginPointPercent;
    this.beginPointNumber = beginPointNumber;
    this.heightPercent = heightPercent;
    this.widthPercent = widthPercent;
    this.heightNumber = heightNumber;
    this.widthNumber = widthNumber;
  }
}
