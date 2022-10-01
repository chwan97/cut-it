import { observer } from 'mobx-react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import BeginCard from 'renderer/component/BeginCard';
import { useMainStore } from 'renderer/hooks';

function Home() {
  const mainStore = useMainStore();

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box
          sx={{
            height: '100vh',
            padding: '30px',
            userSelect: 'none',
            display: 'flex',
            flexFlow: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BeginCard
            text="选择一个文件夹开始裁剪"
            onClick={() => {
              mainStore.cutIt.startFromDir();
            }}
          />
          <BeginCard
            text="选择一张图片开始裁剪"
            sx={{
              marginTop: '30px',
            }}
            onClick={() => {
              mainStore.cutIt.startFromOneImage();
            }}
          />
        </Box>
      </Container>
    </>
  );
}

export default observer(Home);
