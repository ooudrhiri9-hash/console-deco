/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pure static export: `out/` drops straight into cPanel public_html.
  output: 'export',
  // Pin the workspace root. A stray package-lock.json further up the tree
  // otherwise makes Turbopack treat the whole home directory as the project.
  turbopack: { root: import.meta.dirname },
  // Shared hosting has no Next image server, so images ship as-is.
  images: { unoptimized: true },
  // cPanel/Apache serves /produits/ -> /produits/index.html
  trailingSlash: true,
};
export default nextConfig;
