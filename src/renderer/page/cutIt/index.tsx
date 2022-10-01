import { useEffect, useRef } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Swiper, SwiperSlide } from 'swiper/react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { toast } from 'react-toastify';
import {
  MINIMAL_OUTPUT_IMAGE_SIZE_LIMIT,
  SYSTEM_IMAGE_SIZE_LIMIT,
} from 'renderer/constants';
import {
  encodePath,
  floor2,
  getNaturalWAndH,
  imageIdBuilder,
} from 'renderer/utils';
import { useNavigate } from 'react-router-dom';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import { observer } from 'mobx-react';
import Moveable from 'react-moveable';
import Box from '@mui/material/Box';
import Selecto from 'react-selecto';
import { debounce } from 'lodash';
import SwiperCore, {
  Keyboard,
  Virtual,
  Lazy,
  EffectFade,
  Pagination,
  Navigation,
} from 'swiper';

import 'swiper/less';
import 'swiper/less/pagination';
import 'swiper/less/lazy';
import 'swiper/less/effect-fade';
import 'swiper/less/navigation';

import { useMainStore } from 'renderer/hooks';
import { DeleteButtonViewable } from './able/DeleteButtonViewable';
import CutProgress from './component/CutProgress';
import './style.css';

SwiperCore.use([Keyboard, Virtual, Lazy, EffectFade, Pagination, Navigation]);
const debounceToast = debounce(toast, 300);
let inEdge = false;

function BatchCut() {
  const navigate = useNavigate();
  const mainStore = useMainStore();

  useEffect(() => {
    mainStore.cutIt.init();
  }, [mainStore.cutIt]);

  const {
    images,
    activeIndex,
    initialIndex,
    selectedMark,
    hotAreaPosition,
    startCut,
    getIndexById,
    addMarkRaw,
    setActiveIndex,
    setSwiperRef,
    updateMarkById,
    setSelectedMarkById,
    clearSelectedMark,
    refreshPositionByIndex,
  } = mainStore.cutIt;
  const { marks = [] } = images?.[activeIndex] || {};
  const [imageWidth = 0, imageHeight = 0] = getNaturalWAndH(
    images?.[activeIndex]
  );

  useEffect(() => {
    (window as any).gst = mainStore.cutIt.slideTo;
  }, [mainStore.cutIt]);

  const { top, left, height, width } = hotAreaPosition;

  useEffect(() => {
    refreshPositionByIndex(activeIndex);
  }, [activeIndex, refreshPositionByIndex]);

  useEffect(() => {
    setTimeout(() => {
      mainStore.cutIt.forceUpdate();
    });
  }, [mainStore.cutIt]);

  useEffect(() => {
    window.addEventListener('resize', mainStore.cutIt.onResize);
    return () => {
      window.removeEventListener('resize', mainStore.cutIt.onResize);
    };
  }, [mainStore.cutIt.onResize]);

  const resizeRef = useRef<any>({});
  const dragRef = useRef<any>({});
  const selectAreaEnableRef = useRef(false);

  return (
    <div>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={async () => {
              const { quit } = await mainStore.display.quitConfirm();
              if (quit) {
                navigate(-1);
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" component="div">
            裁剪工具
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Button
              color="inherit"
              onClick={() => {
                startCut().catch((e) => {
                  console.error(e);
                });
              }}
            >
              开始裁剪
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Swiper
        key="swiper"
        onSwiper={setSwiperRef}
        initialSlide={initialIndex}
        allowTouchMove={false}
        className="mySwiper"
        effect="fade"
        pagination={{
          type: 'fraction',
        }}
        onSlideChange={(e: SwiperCore) => {
          setActiveIndex(e.activeIndex);
          clearSelectedMark();
        }}
        onReachEnd={() => {
          inEdge = true;
        }}
        onReachBeginning={() => {
          inEdge = true;
        }}
        onKeyPress={(swiper, keyCode) => {
          console.log(
            'onKeyPress String(keyCode)',
            String(keyCode),
            swiper.activeIndex,
            activeIndex
          );
          if (String(keyCode) !== '38' && String(keyCode) !== '40') {
            // 屏蔽掉第一次左右按键触底的弹窗
            if (String(keyCode) !== '39' && String(keyCode) !== '37') {
              return;
            }
            if (inEdge) {
              inEdge = false;
              return;
            }
            if (swiper.activeIndex === 0) {
              debounceToast('当前照片已是第1张');
            } else if (swiper.activeIndex === images.length - 1) {
              debounceToast('当前照片已是最后1张');
            }
            return;
          }
          const preIndex = swiper.activeIndex;
          if (String(keyCode) === '38') {
            swiper.slidePrev();
          }
          if (String(keyCode) === '40') {
            swiper.slideNext();
          }
          if (swiper.activeIndex === 0 && preIndex === 0) {
            debounceToast('当前照片已是第1张');
          } else if (
            swiper.activeIndex === images.length - 1 &&
            preIndex === images.length - 1
          ) {
            debounceToast('当前照片已是最后1张');
          }
        }}
        navigation
        virtual
        keyboard={{
          pageUpDown: false,
        }}
      >
        {images?.map((image, index) => {
          const { path } = image;
          return (
            <SwiperSlide key={path} virtualIndex={index}>
              <Box className="imgWrapper">
                <img
                  src={`file:${encodePath(path)}`}
                  id={imageIdBuilder(index)}
                  alt="SwiperSlide"
                />
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <Box
        onClick={(e) => {
          if (e.currentTarget === e.target) {
            clearSelectedMark();
          }
        }}
        onMouseDownCapture={(e: any) => {
          if (e.currentTarget === e.target) {
            selectAreaEnableRef.current = true;
          }
          setSelectedMarkById(e.target?.id);
        }}
        sx={{
          position: 'fixed',
          // backgroundColor: '#ffeb6258',
          zIndex: 100,
          outline: '7px solid #a8d5e9',
          top,
          left,
          height,
          width,
        }}
        className="dragContainer"
      >
        {marks?.map((mark, index) => {
          const {
            id,
            zIndex,
            widthNumber,
            heightNumber,
            beginPointNumber,
            widthPercent,
            heightPercent,
          } = mark;
          const { top: eleTop = 0, left: eleLeft = 0 } = beginPointNumber || {};
          console.log(
            'image info: imageWidth, imageHeight',
            imageWidth,
            imageHeight
          );
          return (
            <Box
              key={id}
              className="target"
              id={id}
              sx={{
                zIndex,
                position: 'absolute',
                width: widthNumber,
                height: heightNumber,
                transform: `translate(${eleLeft}px, ${eleTop}px)`,
              }}
            >
              <div className="moveable-dimension">{index + 1}</div>
              <br />
              <Box
                className="moveable-dimension"
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '-6px',
                  paddingTop: '8px',
                  backgroundColor:
                    imageWidth * widthPercent! <
                      MINIMAL_OUTPUT_IMAGE_SIZE_LIMIT ||
                    imageHeight * heightPercent! <
                      MINIMAL_OUTPUT_IMAGE_SIZE_LIMIT
                      ? '#a11f1f7a'
                      : '#44aaff7a',
                }}
              >
                宽 {floor2(imageWidth * widthPercent!)} × 高
                {floor2(imageHeight * heightPercent!)}
              </Box>
            </Box>
          );
        })}
        <Selecto
          dragContainer=".dragContainer"
          onDragStart={() => {
            return selectAreaEnableRef.current;
          }}
          onSelectEnd={(e) => {
            selectAreaEnableRef.current = false;
            // eslint-disable-next-line @typescript-eslint/no-shadow
            const { top, left, bottom, right } = e.rect;
            addMarkRaw({
              top,
              left,
              bottom,
              right,
            });
          }}
        />
        <Moveable
          ables={[DeleteButtonViewable]}
          target={selectedMark}
          props={{
            cutItStore: mainStore.cutIt,
          }}
          resizable
          draggable
          snappable
          indexViewable
          deleteButtonViewable
          keepRatio={false}
          throttleResize={0}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          bounds={{ left: 0, right: width, top: 0, bottom: height }}
          edge={false}
          zoom={1}
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          onResizeStart={(e) => {
            e.setOrigin(['%', '%']);

            const resizeMinWidth =
              (SYSTEM_IMAGE_SIZE_LIMIT / imageWidth) * width;
            const resizeMinHeight =
              (SYSTEM_IMAGE_SIZE_LIMIT / imageHeight) * height;

            e.setMin([resizeMinWidth || 40, resizeMinHeight || 40]);
            resizeRef.current = {};
          }}
          onResize={(e) => {
            const { beforeTranslate } = e.drag;
            resizeRef.current = {
              widthC: e.width,
              heightC: e.height,
              leftC: beforeTranslate[0],
              topC: beforeTranslate[1],
            };
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            e.target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)`;
          }}
          onResizeEnd={(e) => {
            const { widthC, heightC, topC, leftC } = resizeRef.current;
            if (
              widthC !== undefined &&
              heightC !== undefined &&
              topC !== undefined &&
              leftC !== undefined
            ) {
              updateMarkById(e.target.id, {
                width: widthC,
                height: heightC,
                top: topC,
                left: leftC,
              });
            }
          }}
          onDragStart={(e) => {
            dragRef.current = {};
            const currentIndex = getIndexById(e.target.id);
            const offset = marks[currentIndex]?.beginPointNumber || {
              left: 0,
              top: 0,
            };
            e.set([offset.left, offset.top]);
          }}
          onDrag={(e) => {
            dragRef.current = {
              topC: e.beforeTranslate[1],
              leftC: e.beforeTranslate[0],
            };
            e.target.style.transform = `translate(${e.beforeTranslate[0]}px, ${e.beforeTranslate[1]}px)`;
          }}
          onDragEnd={(e) => {
            const { topC, leftC } = dragRef.current;
            if (topC !== undefined && leftC !== undefined) {
              updateMarkById(e.target.id, {
                top: topC,
                left: leftC,
              });
            }
          }}
        />
      </Box>
      <CutProgress />
    </div>
  );
}

export default observer(BatchCut);
