import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { observer } from 'mobx-react';
import { QuitDialogType } from 'renderer/constants';

function QuitDialog(props: {
  visible: boolean;
  handleOk: () => void;
  handleClose: () => void;
  quitDialogType: QuitDialogType;
}) {
  const { visible, quitDialogType, handleOk, handleClose } = props;
  if (quitDialogType === QuitDialogType.cut) {
    return (
      <Dialog open={visible} sx={{ zIndex: 11000 }}>
        <DialogTitle>确认要退出裁剪吗？</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ width: '400px' }}>
            退出后数据将不会保存！
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOk}>退出裁剪</Button>
          <Button onClick={handleClose} variant="contained">
            点错了，继续裁剪
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  return (
    <Dialog open={visible}>
      <DialogTitle>确认要退出吗？</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ width: '400px' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOk}>退出</Button>
        <Button onClick={handleClose} variant="contained">
          点错了
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(QuitDialog);
