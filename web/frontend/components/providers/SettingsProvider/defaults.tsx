import { ShopRepresenter } from '@/components/providers/SettingsProvider/types';
import { rails2TsxParameters } from '@/shared/utils/transformers';

export const shopifyApiKey = import.meta.env.VITE_SHOPIFY_API_KEY || '';
export const extensionName = import.meta.env.VITE_EXTENSION_NAME || '';

export const defaultShopRepresenter: ShopRepresenter = {
  customerPortalToken: '',
  settings: {
    collapseSetupGuide: false,
    hideSetupGuide: false,
    loaded: false,
  },
  shopData: {
    shopId: 0,
    shopDomain: '',
    shopHandle: '',
    widgetAppEmbedId: shopifyApiKey,
    widgetAppEmbedName: extensionName,
  }
}

export const makeInitShopRepresenter = (): ShopRepresenter => {
  if (window.BadgesAnimationInitSettings) {
    return rails2TsxParameters(window.BadgesAnimationInitSettings) as ShopRepresenter;
  }

  return defaultShopRepresenter;
}
