import { useEffect, useState } from 'react';
import { NetInfoState, addEventListener, fetch } from '@react-native-community/netinfo';

export default function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch().then((state: NetInfoState) => {
      if (mounted) setIsConnected(state.isConnected ?? true);
    });
    const unsubscribe = addEventListener(state => {
      if (mounted) setIsConnected(state.isConnected ?? true);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return isConnected;
}
