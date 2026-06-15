import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // La cartella del progetto contiene maiuscole e in home esiste un altro
  // lockfile: fissiamo la root di Turbopack su questo progetto.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
