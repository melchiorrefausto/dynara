/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: "/.well-known/dynara.json",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="dynara.json"'
          },
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
