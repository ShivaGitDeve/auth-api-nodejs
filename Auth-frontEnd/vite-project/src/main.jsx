import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/Auth-context.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <StrictMode>
    // <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    // </BrowserRouter>
  // </StrictMode>,
);
