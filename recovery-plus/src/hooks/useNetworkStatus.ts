import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkInfo {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  details: any;
  connectionQuality: 'poor' | 'moderate' | 'good' | 'excellent' | 'unknown';
}

export const useNetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    details: null,
    connectionQuality: 'unknown',
  });

  const determineConnectionQuality = (
    netInfo: any
  ): NetworkInfo['connectionQuality'] => {
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      return 'poor';
    }

    // For cellular connections, check the cellular generation
    if (netInfo.type === 'cellular' && netInfo.details?.cellularGeneration) {
      switch (netInfo.details.cellularGeneration) {
        case '2g':
          return 'poor';
        case '3g':
          return 'moderate';
        case '4g':
        case 'lte':
          return 'good';
        case '5g':
          return 'excellent';
        default:
          return 'moderate';
      }
    }

    // For WiFi connections, assume good quality
    if (netInfo.type === 'wifi') {
      return 'good';
    }

    // For other connection types
    if (netInfo.type === 'ethernet') {
      return 'excellent';
    }

    return 'moderate';
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const quality = determineConnectionQuality(state);

      setNetworkInfo({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details,
        connectionQuality: quality,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isOnline = networkInfo.isConnected && networkInfo.isInternetReachable;
  const canStreamVideo = isOnline && networkInfo.connectionQuality !== 'poor';
  const shouldUseHighQuality =
    networkInfo.connectionQuality === 'excellent' ||
    (networkInfo.connectionQuality === 'good' && networkInfo.type === 'wifi');

  return {
    ...networkInfo,
    isOnline,
    canStreamVideo,
    shouldUseHighQuality,
    getRecommendedVideoQuality: (): string => {
      if (!canStreamVideo) return 'small';

      switch (networkInfo.connectionQuality) {
        case 'poor':
          return 'small';
        case 'moderate':
          return 'medium';
        case 'good':
          return 'large';
        case 'excellent':
          return 'hd720';
        default:
          return 'medium';
      }
    },
  };
};
