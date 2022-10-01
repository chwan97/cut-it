import log from 'electron-log';

class Logger {
  error = (...params: any[]) => {
    log.error(process.env.VERSION, ...params);
  };

  info = (...params: any[]) => {
    log.info(process.env.VERSION, ...params);
  };
}

export default new Logger();
