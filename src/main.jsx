import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./Site.jsx";
import "./site.css";

const content = (
  <StrictMode>
    <App />
  </StrictMode>
);
const root = document.getElementById("root");
if (root.querySelector("main")) hydrateRoot(root, content);
else createRoot(root).render(content);
