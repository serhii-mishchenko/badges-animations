export const urls = {
    appEmbededUrl: (shopHandle: string, queryString: string): string => {
        //return `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?${queryString}`;
        return `https://${shopHandle}/admin/themes/current/editor?${queryString}`;
    }
}