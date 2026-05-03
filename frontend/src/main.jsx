import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Thiếu #root trong index.html — không thể khởi tạo React.');
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);

  
