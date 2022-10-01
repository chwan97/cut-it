import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { observer } from 'mobx-react';

function CutResultDialog(props: {
  visible: boolean;
  handleOk: () => void;
  handleClose: () => void;
}) {
  const { visible, handleOk, handleClose } = props;
  return (
    <Dialog open={visible}>
      <DialogTitle>照片裁剪已完成</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ width: '400px' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOk} variant="contained">
          打开裁剪结果所在文件夹
        </Button>
        <Button onClick={handleClose}>好的</Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(CutResultDialog);
