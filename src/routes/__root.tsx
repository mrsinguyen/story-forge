import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { IconContext } from "@phosphor-icons/react";
import { Tooltip } from "@src/components/primitives/tooltip";
import { Toast } from "@src/components/primitives/toast";
import { ConnectivityToast } from "@src/components/shell/connectivity-toast";
import { PwaUpdateToast } from "@src/components/shell/pwa-update-toast";
import { RouteError, RouteNotFound } from "@src/components/shell/route-error";
import { ThemeProvider } from "@src/lib/theme";
import { ReaderSettingsProvider } from "@src/lib/reader-settings";

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const iconDefaults = { size: 20, weight: "light" as const };

function RootLayout() {
  return (
    <ThemeProvider>
      <ReaderSettingsProvider>
        <Tooltip.Provider>
          <Toast.Provider>
            <IconContext.Provider value={iconDefaults}>
              <Outlet />
              <Toast.Viewport />
              <ConnectivityToast />
              <PwaUpdateToast />
              {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
            </IconContext.Provider>
          </Toast.Provider>
        </Tooltip.Provider>
      </ReaderSettingsProvider>
    </ThemeProvider>
  );
}
