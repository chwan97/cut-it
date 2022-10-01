export default class Point {
  top: number;

  left: number;

  constructor(props: Point) {
    const { top, left } = props;
    this.top = top;
    this.left = left;
  }
}
