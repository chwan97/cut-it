import React, { useContext, useState } from 'react';
import StoreContext from 'renderer/context/StoreContext';
import WarningContext, { WarningFn } from 'renderer/context/WarningContext';
import MainStore from 'renderer/store';

export const useMainStore = (): MainStore => {
  const mainStore = useContext(StoreContext);
  if (!mainStore) {
    throw new Error('mainStore not find!');
  }
  return mainStore;
};

export const useWarningState = (): [
  string,
  React.ReactNode,
  boolean,
  () => void,
  (text: string) => void
] => {
  const [state, setState] = useState<{
    warningEle: React.ReactNode;
    title: string;
    open: boolean;
  }>({
    warningEle: '',
    title: '',
    open: false,
  });
  const { title, warningEle, open } = state;
  const handleClose = () => {
    setState({
      ...state,
      open: false,
    });
  };
  const warning = (text: React.ReactNode, titleRaw = '警告') => {
    setState({
      warningEle: text,
      title: titleRaw,
      open: true,
    });
  };
  return [title, warningEle, open, handleClose, warning];
};

export const useWarningFn = (): [WarningFn] => {
  const warningContext = useContext(WarningContext);
  if (!warningContext) {
    throw new Error('warningContext not find!');
  }
  const { warning } = warningContext;
  return [warning];
};

export const useDialog = (): [boolean, () => void, () => void] => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return [open, handleOpen, handleClose];
};
