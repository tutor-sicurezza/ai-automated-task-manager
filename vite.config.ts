import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// `vercel dev` avvia il dev server su una porta che sceglie lui e la passa in
// PORT, poi aspetta che qualcuno si metta in ascolto li'. sparkPlugin() pero'
// forza `server.port = 5000` e ignora l'opzione: la porta attesa non si apriva
// mai e `vercel dev` moriva con "Detecting port <n> timed out after 300000ms".
// Siccome le rotte di api/ (creazione utenti, ruoli, email) si possono provare
// in locale SOLO con `vercel dev`, questa riga e' la differenza fra poterle
// collaudare e non poterlo fare. Senza PORT si resta sui 5000 di sempre.
const devPort = Number(process.env.PORT) || 5000

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin({ port: devPort }) as PluginOption,
  ],
  // Vite si legava al solo loopback IPv6 ([::1]). `vercel dev` fa da proxy
  // verso 127.0.0.1, quindi ogni richiesta che non fosse una funzione di api/
  // moriva con 500 FUNCTION_INVOCATION_FAILED: l'applicazione non si apriva
  // affatto sotto `vercel dev`, che e' pero' l'unico modo di provare in locale
  // le rotte api/ (creazione utenti, ruoli, email). Loopback esplicito su IPv4:
  // resta raggiungibile solo dalla macchina, come prima.
  server: {
    host: '127.0.0.1',
    port: devPort,
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
