import { useSettingsContext } from "@/components/providers/SettingsProvider/SettingsProvider";
import { urls } from "@/shared/utils/urls";

export const useNavigate = () => {
  const {
    shopData: { shopDomain, widgetAppEmbedId, widgetAppEmbedName },
  } = useSettingsContext();

  const navigateToAppEmbeded = () => {
    const APP_EMBED_ID = `${widgetAppEmbedId}/${widgetAppEmbedName}`;

    const params = {
      activateAppId: `${APP_EMBED_ID}/app-embed-block`,
      appEmbed: APP_EMBED_ID,
      context: 'apps',
      template: 'index',
      enable: 'true',
      overlay: 'true',
    };

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    window.open(urls.appEmbededUrl(shopDomain, queryString), '_blank')?.focus();
  }

  return {
    navigateToAppEmbeded
  };
}