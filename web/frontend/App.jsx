import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";
import { SettingsProvider } from "./components/providers/SettingsProvider/SettingsProvider";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <SettingsProvider>
            <NavMenu>
              <a href="/" rel="home" />
            </NavMenu>
            <Routes pages={pages} />
          </SettingsProvider>
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
