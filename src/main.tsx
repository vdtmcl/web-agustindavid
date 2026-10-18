import { initializeGA4 } from './utils/ga4';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AdminApp from "./AdminApp";

initializeGA4();

const root = createRoot(document.getElementById("root")!);
const isAdmin = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");

root.render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
);
