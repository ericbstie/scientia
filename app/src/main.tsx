import { createRoot } from "react-dom/client";
import { initSupabase } from "./lib/supabase";
import { App } from "./App";

await initSupabase();
createRoot(document.getElementById("root")!).render(<App />);
