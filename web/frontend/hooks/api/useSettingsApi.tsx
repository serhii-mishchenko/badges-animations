import { useAuthenticatedFetch } from '@/hooks/api/utils/useAuthenticatedFetch';
import { tsx2RailsParameters, rails2TsxParameters } from '@/shared/utils/transformers';
import { useQuery } from 'react-query';
import { Settings, ShopRepresenter } from '@/components/providers/SettingsProvider/types';
import { useCallback, useMemo } from 'react';

export const useSettingsApi = () => {
  const fetch = useAuthenticatedFetch();
  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
  }), []);

  const get = useCallback(async (): Promise<ShopRepresenter> => {
    const response = await fetch('/api/settings/all', {
      headers: headers,
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Transform snake_case to camelCase
    return rails2TsxParameters(data) as ShopRepresenter;
  }, [fetch, headers]);

  const put = useCallback(async (
    data: Settings,
    onSuccess: (settings: ShopRepresenter) => void,
    onError: () => void,
  ) => {
    try {
      // Use the authenticated fetch function (fetch is from useAuthenticatedFetch)
      const response = await fetch('/api/settings/all', {
        body: JSON.stringify({
          settings: { settings: tsx2RailsParameters(data) },
        }),
        headers: headers,
        method: 'PUT',
      });
      
      
      if (response.ok) {
        const settings = await response.json();
        // Transform snake_case to camelCase
        const transformedSettings = rails2TsxParameters(settings) as ShopRepresenter;
        onSuccess(transformedSettings);
      } else {
        const errorText = await response.text();
        console.error('Failed to update settings:', response.status, errorText);
        onError();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      onError();
    }
  }, [fetch, headers]);

  return { get, put };
}

/**
 * Get app embeds status - checks if the badges-animation app embed block is enabled
 * Uses the Shopify Admin API to check the theme's settings_data.json
 */
const useGetAppEmbedsStatusQuery = () => {
  const fetch = useAuthenticatedFetch();
  return async () => {
    const response = await fetch('/api/settings/app_embeds_status');
    
    // Check if response is OK and is JSON
    if (!response.ok) {
      throw new Error(`Failed to fetch app embeds status: ${response.status} ${response.statusText}`);
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
    }
    
    const appEmbedsStatusData = await response.json();
    return appEmbedsStatusData.app_embeds_status || false;
  };
}

export const useGetAppEmbedsStatus = () => {
  const get = useGetAppEmbedsStatusQuery();
  return useQuery({
    queryFn: get,
    queryKey: ['appEmbedsStatus'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });
}

export const usePollingAppEmbedsStatus = () => {
  const get = useGetAppEmbedsStatusQuery();
  return useQuery({
    queryFn: get,
    queryKey: ['pollingAppEmbedsStatus'],
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });
}
