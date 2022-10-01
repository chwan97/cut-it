import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

export default function WarningDialog(props: {
  title: string;
  warningEle: React.ReactNode;
  handleClose: () => void;
  open: boolean;
}) {
  const { title, warningEle, handleClose, open } = props;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" sx={{ userSelect: 'text' }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box
          id="alert-dialog-description"
          sx={{ minWidth: '450px', userSelect: 'text' }}
        >
          {warningEle}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          好的
        </Button>
      </DialogActions>
    </Dialog>
  );
}
