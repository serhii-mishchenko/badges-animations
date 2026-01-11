// Type augmentation to fix TypeScript 5.0 compatibility with react-router-dom v6
// This fixes the "'Route' cannot be used as a JSX component" error

import type { ReactNode, ComponentType, JSX } from "react";

declare module "react-router-dom" {
  // Augment Route component to return ReactNode instead of ReactElement | null
  export interface RouteProps {
    path?: string;
    element?: ReactNode;
    children?: ReactNode;
    caseSensitive?: boolean;
    index?: boolean;
  }
  
  // Override Route to return JSX.Element (which is compatible with ReactNode)
  export function Route(props: RouteProps): JSX.Element;
  
  // Augment Routes component
  export interface RoutesProps {
    children?: ReactNode;
    location?: Partial<Location> | string;
  }
  
  // Override Routes to return JSX.Element
  export function Routes(props: RoutesProps): JSX.Element;
  
  // Ensure BrowserRouter is still exported
  export interface BrowserRouterProps {
    children?: ReactNode;
    basename?: string;
    future?: {
      v7_startTransition?: boolean;
      v7_relativeSplatPath?: boolean;
    };
  }
  
  export function BrowserRouter(props: BrowserRouterProps): JSX.Element;
  
  // Re-export useLocation and other hooks
  export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };
}
