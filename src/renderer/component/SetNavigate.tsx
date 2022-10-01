import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { useMainStore } from 'renderer/hooks';

export default function SetNavigate() {
  const navigate = useNavigate();
  const mainStore = useMainStore();

  useEffect(() => {
    mainStore.setNavigate(navigate);
  }, [navigate, mainStore]);

  return <></>;
}
