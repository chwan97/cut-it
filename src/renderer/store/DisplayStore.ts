import { makeAutoObservable } from 'mobx';
import { QuitDialogType } from 'renderer/constants';

export default class DisplayStore {
  main: any;

  globalLoading = false;

  quitConfirmVisible = false;

  loadingText?: string = '';

  quitDialogType = QuitDialogType.common;

  confirmPromiseResolve?: any;

  confirmPromiseReject?: any;

  constructor(main: any) {
    makeAutoObservable(this);
    this.main = main;
  }

  setGlobalLoading = (state: boolean, loadingText?: string) => {
    this.globalLoading = state;
    this.loadingText = loadingText;
  };

  quitConfirm = (): Promise<{ quit: boolean }> => {
    if (!window.location.hash.includes('cut-it')) {
      this.quitDialogType = QuitDialogType.common;
    } else {
      this.quitDialogType = QuitDialogType.cut;
    }

    this.quitConfirmVisible = true;
    return new Promise((resolve, reject) => {
      this.confirmPromiseResolve = resolve;
      this.confirmPromiseReject = reject;
    });
  };

  confirmOk = () => {
    this.quitConfirmVisible = false;
    this.confirmPromiseResolve?.({
      quit: true,
    });
  };

  confirmCancel = () => {
    this.quitConfirmVisible = false;
    this.confirmPromiseResolve?.({
      quit: false,
    });
  };
}
