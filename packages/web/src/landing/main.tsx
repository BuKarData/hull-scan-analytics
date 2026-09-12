import React from "react";
import ReactDOM from "react-dom/client";
import { LandingLang } from "./i18n";
import { Landing } from "./Landing";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LandingLang>
      <Landing />
    </LandingLang>
  </React.StrictMode>
);
