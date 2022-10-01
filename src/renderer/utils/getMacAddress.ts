import macAddress from 'macaddress';

interface IMacs {
  physicals: string[];
  virtual: string[];
}

export default () => {
  return new Promise<IMacs>((resolve, reject) => {
    macAddress.all((err, macs) => {
      const physicals: string[] = [];
      const virtual: string[] = [];

      if (err) reject(err);
      console.log('all mac address: ', macs);

      for (const key of Object.keys(macs)) {
        const address = macs[key].mac;
        if (key.toLocaleLowerCase().indexOf('virtual') > -1) {
          virtual.push(address);
          continue;
        }

        if (key.toLocaleLowerCase().indexOf('vm') > -1) {
          virtual.push(address);
          continue;
        }

        if (address?.indexOf('00:50:56') === 0) {
          virtual.push(address);
          continue;
        }
        if (address?.indexOf('00:05:69') === 0) {
          virtual.push(address);
          continue;
        }
        if (address?.indexOf('00:15:5d') === 0) {
          virtual.push(address);
          continue;
        }
        if (address) {
          physicals.push(address);
        }
      }

      resolve({ physicals, virtual });
    });
  });
};
