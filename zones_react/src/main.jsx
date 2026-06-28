import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./index.css";
import "./shared/utils/zonesAlerts.css";
import App from "./App.jsx";
import { setupApiAuthInterceptor } from "./shared/api/setupApiAuthInterceptor";
import { purgeLegacyMockAuth } from "./features/auth/data/mockUsersStorage";
import { purgeLegacyFinanceData } from "./features/finance/data/financeApiCache";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { BrandingProvider } from "./shared/context/BrandingContext";
import { TenantProvider } from "./shared/tenant/TenantProvider";
import { ZonesToastProvider } from "./shared/context/ZonesToastContext";
import { toastOptions } from "./shared/utils/zonesAlerts";

purgeLegacyMockAuth();
setupApiAuthInterceptor();
purgeLegacyFinanceData();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrandingProvider>
        <BrowserRouter>
          <TenantProvider>
            <ZonesToastProvider>
              <App />
              <ToastContainer {...toastOptions} newestOnTop limit={4} />
            </ZonesToastProvider>
          </TenantProvider>
        </BrowserRouter>
      </BrandingProvider>
    </ThemeProvider>
  </StrictMode>,
);
