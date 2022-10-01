import React from 'react';

export type WarningFn = (text: string, title?: string) => void;

export interface WarningContextValue {
  warning: WarningFn;
}

const WarningContext = React.createContext<WarningContextValue | null>(null);
export default WarningContext;
