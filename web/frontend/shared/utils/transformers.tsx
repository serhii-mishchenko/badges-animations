const GIFT_PROPERTY = '__BadgesAnimation_shop_badge_id';

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const isISODate = (str: any): boolean => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return isoDateRegex.test(str);
};

export const rails2TsxParameters = (params: any, deep: boolean = true) => {
  if (!params) return null;

  const updatedParams: [string, any][] = Object.entries(params).map(([key, value]) => {
    const updatedKey = toCamelCase(key);

    if (typeof value === 'string' && isISODate(value)) {
      return [updatedKey, new Date(value)];
    }

    if (key === GIFT_PROPERTY) {
      return [key, value];
    }

    if (
      deep &&
      typeof value === 'object' &&
      value !== null &&
      // For some reason, Shopify returns array as object
      !Array.isArray(value)
    ) {
      return [updatedKey, rails2TsxParameters(value)];
    }

    if (Array.isArray(value)) {
      return [
        updatedKey,
        value.map((item) => {
          if (typeof item === 'string') return item;
          return rails2TsxParameters(item);
        }),
      ];
    }

    return [updatedKey, value];
  });

  return Object.fromEntries(updatedParams);
};

export const tsx2RailsParameters = (params: any, deep: boolean = true) => {
  const updatedParams: [string, any][] = Object.entries(params).map(([key, value]) => {
    const updatedKey = toSnakeCase(key);

    if (key === GIFT_PROPERTY) {
      return [key, value];
    }

    if (value instanceof Date) {
      return [updatedKey, value.toISOString()];
    }

    if (
      deep &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      return [updatedKey, tsx2RailsParameters(value)];
    }

    if (Array.isArray(value)) {
      return [
        updatedKey,
        value.map((item) => {
          if (typeof item === 'string') return item;
          return tsx2RailsParameters(item);
        }),
      ];
    }

    return [updatedKey, value];
  });

  return Object.fromEntries(updatedParams);
};
