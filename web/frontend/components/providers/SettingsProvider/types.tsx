export type Settings = {
  collapseSetupGuide: boolean;
  hideSetupGuide: boolean;
  loaded: boolean;
}

export type ShopData = {
  shopId: number;
  shopDomain: string;
  shopHandle: string;
  widgetAppEmbedId: string;
  widgetAppEmbedName: string;
}

export type ShopRepresenter = {
  customerPortalToken: string;
  settings: Settings;
  shopData: ShopData;
}

export type UpdateSettingsOptions = {
  sendRequest?: boolean;
  showToast?: boolean;
}

export type SettingsProviderType = ShopRepresenter & {
  updateSettings: (data: any, options?: UpdateSettingsOptions) => void;
}
