import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import PartnerApp from "./PartnerApp";
import "../index.css";

// Clear invitation fragments before rendering or issuing any network requests.
const invitation = new URLSearchParams(window.location.hash.slice(1)).get("invite");
if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
createRoot(document.getElementById("partner-root")!).render(<BrowserRouter><PartnerApp invitation={invitation} /></BrowserRouter>);
