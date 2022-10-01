import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import { useMainStore } from 'renderer/hooks';
import { observer } from 'mobx-react';

function CutProgress() {
  const mainStore = useMainStore();
  const { cutProgressVisible, totalCutNum, currentCutNum } = mainStore.cutIt;
  if (!cutProgressVisible) return null;
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'rgba(0,0,0,0.3)',
        zIndex: 400,
      }}
    >
      <Box
        sx={{
          margin: '30vh auto',
          background: '#fff',
          width: '400px',
          padding: ' 16px 16px 5px',
        }}
      >
        <LinearProgress
          sx={{
            width: '100%',
          }}
          variant="determinate"
          value={(currentCutNum / totalCutNum) * 100}
        />
        <Box
          sx={{
            color: '#333',
            textAlign: 'center',
          }}
        >
          裁剪图片生成中... {currentCutNum}/{totalCutNum}
        </Box>
      </Box>
    </Box>
  );
}

export default observer(CutProgress);
