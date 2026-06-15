import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // In home esiste un altro package-lock.json: senza questo, Next sceglie
  // la home come "workspace root" e l'output per Vercel risulta incompleto.
  // Fissiamo la root sul progetto.
  outputFileTracingRoot: path.join(__dirname),
  // Demo: non bloccare la build di produzione su questioni di lint.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
