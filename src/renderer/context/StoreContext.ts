import React from 'react';
import MainStore from 'renderer/store';

const StoreContext = React.createContext<MainStore | null>(null);
export default StoreContext;
