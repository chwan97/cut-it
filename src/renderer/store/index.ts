import { makeAutoObservable } from 'mobx';
import { hashMaker } from 'renderer/utils';
import { ipcRenderer } from 'electron';
import log from 'renderer/utils/logger';
import DisplayStore from './DisplayStore';
import CutItStore from './CutItStore';
import { WarningFn } from 'renderer/context/WarningContext';

export default class Index {
  display: DisplayStore;

  cutIt: CutItStore;

  warningFn: WarningFn = (_) => {};

  navigate: any;

  macAddressHash?: string = '';

  macAddressGotError = false;

  intervalId: any = null;

  desktopDir: string = '';

  constructor() {
    makeAutoObservable(this);
    this.display = new DisplayStore(this);
    this.cutIt = new CutItStore(this);

    setTimeout(() => {
      this.getDesktopDir();
    }, 3 * 1000);

    hashMaker()
      .then((macHash: string) => {
        this.macAddressHash = macHash;
        this.macAddressGotError = false;
        log.info('getMacHash macHash:', macHash);
        return macHash;
      })
      .catch((error) => {
        log.error(error);
        this.macAddressGotError = true;
      });
  }

  getDesktopDir = () => {
    ipcRenderer
      .invoke('getDesktopDir')
      .then((data) => {
        this.desktopDir = data;
        return data;
      })
      .catch((error) => {
        log.error(error);
      });
  };

  setWarningFn = (warning: WarningFn) => {
    this.warningFn = warning;
  };

  setNavigate = (navigate: any) => {
    this.navigate = navigate;
  };

  checkAndRefresh = async () => {
    if (this.macAddressHash) {
      return true;
    }
    try {
      await hashMaker()
        .then((macHash: string) => {
          this.macAddressHash = macHash;
          return macHash;
        })
        .catch((error) => {
          log.error(error);
          this.macAddressGotError = true;
        });
      return true;
    } catch (e) {
      log.error('getMacHash 失败:', e);
      return false;
    }
  };

  addIntervalTask = () => {
    this.intervalId = setInterval(() => {
      this.checkAndRefresh();
    }, 1000 * 120);
  };

  clearIntervalTask = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };
}
