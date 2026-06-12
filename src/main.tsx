import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./scrollbars.css";
import "./expansion.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
