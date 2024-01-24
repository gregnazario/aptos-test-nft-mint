import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./css";

import { Buffer as BufferPolyFill } from "buffer";
import App from "./App";


window.Buffer = BufferPolyFill;

/* eslint-disable @typescript-eslint/no-use-before-define */

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);