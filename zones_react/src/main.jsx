import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./index.css";
import "./shared/utils/zonesAlerts.css";
import App from "./App.jsx";
import { runDemoBootstrap } from "./shared/demo/demoBootstrap";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { ZonesToastProvider } from "./shared/context/ZonesToastContext";
import { toastOptions } from "./shared/utils/zonesAlerts";

runDemoBootstrap();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ZonesToastProvider>
          <App />
          <ToastContainer {...toastOptions} newestOnTop limit={4} />
        </ZonesToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
