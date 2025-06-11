import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { setupAxiosInterceptors } from "./services/apiClient";
import { setTokens, logout } from "./features/auth/authSlice"; // Import the actions
import { Provider } from "react-redux";
import { store } from "./store";

// Setup Axios interceptors after store is initialized
setupAxiosInterceptors(
  { getState: store.getState, dispatch: store.dispatch },
  { setTokens, logout } // Pass the action creators
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
