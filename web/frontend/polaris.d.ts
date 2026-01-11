// Type augmentation to fix TypeScript 5.0 compatibility with @shopify/polaris
// This fixes JSX component errors with Polaris components

import type { ReactNode, JSX, Component, FunctionComponent } from "react";

declare module "@shopify/polaris" {
  // AppProvider (class component)
  export interface AppProviderProps {
    i18n: any;
    linkComponent?: any;
    features?: any;
    children?: ReactNode;
  }

  export class AppProvider extends Component<AppProviderProps> {
    render(): JSX.Element;
  }

  // Fix for function components that return ReactNode | Promise<ReactNode>
  // This ensures they're recognized as valid JSX components
  type PolarisComponent<P = {}> = FunctionComponent<P> & {
    [key: string]: any;
  };

  // Override common Polaris components to return JSX.Element
  export const Card: PolarisComponent<any>;

  export const Page: PolarisComponent<any>;
  export const Layout: PolarisComponent<any> & {
    Section: PolarisComponent<any>;
    AnnotatedSection: PolarisComponent<any>;
  };
  export const FormLayout: PolarisComponent<any>;
  export const Button: PolarisComponent<any>;
  export const Text: PolarisComponent<any>;
  export const Banner: PolarisComponent<any>;
  export const Image: PolarisComponent<any>;
  export const Stack: PolarisComponent<any>;
  export const Popover: PolarisComponent<any>;
  export const ActionList: PolarisComponent<any>;
  export const Thumbnail: PolarisComponent<any>;
  export const Box: PolarisComponent<any>;
  export const BlockStack: PolarisComponent<any>;
  export const InlineStack: PolarisComponent<any>;
}