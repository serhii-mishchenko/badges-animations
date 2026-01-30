import { createApp } from '@shopify/app-bridge';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { useCallback, useMemo } from 'react';

/**
 * A hook that returns an auth-aware fetch function.
 * @desc The returned fetch function that matches the browser's fetch API
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * It will provide the following functionality:
 *
 * 1. Add a `X-Shopify-Access-Token` header to the request.
 * 2. Check response for `X-Shopify-API-Request-Failure-Reauthorize` header.
 * 3. Redirect the user to the reauthorization URL if the header is present.
 *
 * @returns {Function} fetch function
 */
export function useAuthenticatedFetch(): (uri: string, options?: RequestInit) => Promise<Response> {
  const shopify = useAppBridge();
  const app = useMemo(() => createApp({
    apiKey: shopify.config.apiKey,
    host: shopify.config.host || '',
  }), [shopify.config.apiKey, shopify.config.host]);

  const fetchFunction = useCallback(async (uri: string, options?: RequestInit) => {
    const sessionToken = await app
      .getState()
      // @ts-expect-error some state shopify error
      .then((state) => state.sessionToken);
    const headers = {
      // "Content-Type": "application/json",
      'X-Shopify-Access-Token': sessionToken,
    };

    return fetch(uri, {
      ...options,
      headers: {
        ...options?.headers,
        ...headers,
      },
    });
  }, [app]);

  return useCallback(async (uri: string, options?: RequestInit) => {
    const response = await fetchFunction(uri, options);
    checkHeadersForReauthorization(response.headers, app);
    return response;
  }, [fetchFunction, app]);
}

function checkHeadersForReauthorization(headers: Headers, app: ReturnType<typeof createApp>) {
  if (headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
    const authUrlHeader =
      headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url') ||
      `/api/auth`;

    const redirect = Redirect.create(app);
    redirect.dispatch(
      Redirect.Action.REMOTE,
      authUrlHeader.startsWith('/')
        ? `https://${window.location.host}${authUrlHeader}`
        : authUrlHeader,
    );
  }
}
