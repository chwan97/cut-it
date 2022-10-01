import { useEffect } from 'react';
import { ipcRenderer, shell } from 'electron';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { observer, useLocalObservable } from 'mobx-react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import logger from 'electron-log';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import log from 'renderer/utils/logger';

import Home from 'renderer/page/home';
import MainStore from 'renderer/store/index';
import BatchCut from 'renderer/page/cutIt';
import { useWarningState } from 'renderer/hooks';
import StoreContext from 'renderer/context/StoreContext';
import WarningContext from 'renderer/context/WarningContext';
import WarningDialog from 'renderer/component/WarningDialog';
import SetNavigate from 'renderer/component/SetNavigate';
import QuitDialog from 'renderer/component/QuitDialog';
import CutResultDialog from 'renderer/component/CutResultDialog';
import 'renderer/App.css';

function GlobalLoading(props: { loadingText: string }) {
  const { loadingText } = props;
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'rgba(0,0,0,0.3)',
        zIndex: 10000,
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
        />
        <Box
          sx={{
            color: '#333',
            textAlign: 'center',
          }}
        >
          {loadingText}
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const mainStore = useLocalObservable(() => new MainStore());
  const [title, warningEle, open, handleClose, warning] = useWarningState();
  mainStore.setWarningFn(warning);

  const { macAddressGotError, macAddressHash } = mainStore;

  const {
    loadingText,
    quitConfirmVisible,
    globalLoading,
    quitDialogType,
    confirmOk,
    confirmCancel,
  } = mainStore.display;

  const { resultTipsVisible, openTargetDir, closeTips } = mainStore.cutIt;

  useEffect(() => {
    mainStore.addIntervalTask();
    return () => {
      mainStore.clearIntervalTask();
    };
  }, [mainStore]);

  useEffect(() => {
    const onQuit = () => {
      (async () => {
        const { quit } = await mainStore.display.quitConfirm();
        if (quit) {
          ipcRenderer.send('quit-app-gu');
        }
      })().catch((e) => console.error(e));
    };
    ipcRenderer.on('system-quit', onQuit);
    return () => {
      ipcRenderer.removeListener('system-quit', onQuit);
    };
  }, [mainStore.display]);

  return (
    <Box>
      {globalLoading ? <GlobalLoading loadingText={loadingText || ''} /> : null}
      <QuitDialog
        visible={quitConfirmVisible}
        handleOk={confirmOk}
        quitDialogType={quitDialogType}
        handleClose={confirmCancel}
      />
      <CutResultDialog
        visible={resultTipsVisible}
        handleOk={openTargetDir}
        handleClose={closeTips}
      />
      <StoreContext.Provider value={mainStore}>
        <WarningContext.Provider
          value={{
            warning,
          }}
        >
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cut-it" element={<BatchCut />} />
            </Routes>
            <SetNavigate />
          </Router>
          <WarningDialog
            warningEle={warningEle}
            title={title}
            handleClose={handleClose}
            open={open}
          />
        </WarningContext.Provider>
      </StoreContext.Provider>

      <Box
        sx={{
          bottom: '5px',
          left: '5px',
          position: 'fixed',
          color: 'red',
          userSelect: 'text',
          zIndex: 999,
        }}
        onClick={() => {
          const logPath = logger.transports.file.getFile().path;
          log.info('logPath:', logger.transports.file.getFile().path);
          shell.openPath(logPath);
        }}
        onContextMenu={(e) => {
          if (e.altKey) {
            mainStore.cutIt.superFill();
          }
        }}
      >
        {!macAddressGotError ? ` 机器码: ${macAddressHash}` : '机器码获取失败'}
      </Box>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
      />
    </Box>
  );
}

export default observer(App);

export { StoreContext };
