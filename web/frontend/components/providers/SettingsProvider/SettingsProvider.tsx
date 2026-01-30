import { useSettingsApi } from '@/hooks/api/useSettingsApi';
import { makeInitShopRepresenter } from '@/components/providers/SettingsProvider/defaults';
import {
  Settings,
  SettingsProviderType,
  ShopRepresenter,
  UpdateSettingsOptions,
} from '@/components/providers/SettingsProvider/types';
import { useAppBridge } from '@shopify/app-bridge-react';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';

const defaultSettings: SettingsProviderType = {
  ...makeInitShopRepresenter(),
  updateSettings: () => {}
}

export const SettingsContext = React.createContext<SettingsProviderType>(defaultSettings);
SettingsContext.displayName = 'SettingsContext';

export const useSettingsContext = (): SettingsProviderType => {
  const context = useContext(SettingsContext);
  if (!context) {
    return defaultSettings;
  }
  return context;
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const shopify = useAppBridge();

  // Initialize with defaults first
  const [shopRepresenter, setShopRepresenter] = useState(
    makeInitShopRepresenter(),
  );
  const { get, put } = useSettingsApi();

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await get();
        // Merge loaded settings with defaults to ensure all fields are present
        const defaultSettings = makeInitShopRepresenter();
        setShopRepresenter({
          ...defaultSettings,
          ...loadedSettings,
          settings: {
            ...defaultSettings.settings,
            ...loadedSettings.settings,
            loaded: true,
          },
          shopData: {
            ...defaultSettings.shopData,
            ...loadedSettings.shopData,
          },
        });
      } catch (error) {
        // If loading fails, use defaults (already set in useState)
        console.error('Failed to load settings from database:', error);
      }
    };

    loadSettings();
  }, [get]);

  const updateSettings = useCallback((
    data: Settings,
    options: UpdateSettingsOptions = { sendRequest: true, showToast: true },
  ) => {
    const { sendRequest = true, showToast = true } = options;

    setShopRepresenter((prev: ShopRepresenter) => {
      const settings: Settings = { ...prev.settings, ...data };
      
      if (sendRequest) {
        put(
          settings,
          (updatedSettings) => {
            // Update with the response from server to ensure consistency
            setShopRepresenter((current: ShopRepresenter) => ({
              ...current,
              ...updatedSettings,
              settings: {
                ...current.settings,
                ...updatedSettings.settings,
              },
            }));
            if (showToast) {
              shopify.toast.show('Updated successfully');
            }
          },
          () => {
            if (showToast) {
              shopify.toast.show('Something went wrong', { isError: true });
            }
          },
        );
      }
      
      return { ...prev, settings };
    });
  }, [put, shopify]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<SettingsProviderType>(() => ({
    ...shopRepresenter,
    updateSettings,
  }), [shopRepresenter, updateSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
