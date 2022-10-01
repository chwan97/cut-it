# cut-it

>一个图片裁切桌面应用，把图片裁切为选中的多个小图片。
>a desktop application to cut images into many pieces.<br/>

![演示图片1](https://res.cloudinary.com/dlf0lauxy/image/upload/v1664635038/github/1_koj4gn.png)
![演示图片2](https://res.cloudinary.com/dlf0lauxy/image/upload/v1664635037/github/2_udkhpq.png)
![演示图片3](https://res.cloudinary.com/dlf0lauxy/image/upload/v1664635036/github/3_jkjdsi.png)
![演示图片4](https://res.cloudinary.com/dlf0lauxy/image/upload/v1664635037/github/4_strwes.png)

使用 Electron、SharpJS、MUI、React、Mbox。

## start

Start the app in the `dev` environment:

当Sharp支持多目标平台的话 可以去除 sharp 重装的逻辑

```bash
npm run replaceSharpVersionToArm
npm run start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```
