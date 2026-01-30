import { useSettingsContext } from '@/components/providers/SettingsProvider/SettingsProvider';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';

// Page Events:
// New Automatic Gift Page Opened
// Home Page opened
// Statistics Page opened

// Guide Events:
// Activate App Embed Block from Setup Guide
// Verify Gift is Automatically Added - Not working
// Verify Gift is Automatically Added - All good

// Banners
// Activate App Embed Block
// Manage Subscription Page

// Promotion Events:
// validation error
// triggers set
// actions set
// activate promotion
// pause promotion
// delete promotion
// promotion widget tab opened

const IS_PROD = import.meta.env.PROD;

// Singleton pattern to ensure Mixpanel is only initialized once
const MixpanelManager = (() => {
  let isInitialized = false;

  return {
    initialize: () => {
      if (isInitialized) return;

      mixpanel.init('fdb37cc10eb137ffa1d96ac554833e65', {
        debug: !IS_PROD,
        ignore_dnt: true,
        persistence: 'localStorage',
        track_pageview: false,
      });

      isInitialized = true;
    },
  };
})();

export const useMixpanel = () => {
  // Get shopData from context
  const contextValue = useSettingsContext();
  const shopData = contextValue.shopData;

  useEffect(() => {
    MixpanelManager.initialize();

    if (!shopData) return;
    if (!IS_PROD) return;
    mixpanel.identify(shopData.shopId.toString());
  }, [shopData]);

  const trackEvent = (eventName: string, data?: any) => {
    if (!IS_PROD) return;
    mixpanel.track(eventName, data);
  };

  return { trackEvent };
};
