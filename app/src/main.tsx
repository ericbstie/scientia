// Designsystemet's behaviours (dialog closing, card click delegation, field labelling). The React
// package is marked side-effect free (patches/) so unused components drop out of the bundle;
// this import keeps the behaviours whichever components are in use.
import "@digdir/designsystemet-web";
import { createRoot } from "react-dom/client";
import { initSupabase } from "./lib/supabase";
import { App } from "./App";

await initSupabase();
createRoot(document.getElementById("root")!).render(<App />);
