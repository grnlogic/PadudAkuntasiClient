module.exports = {
  apps: [
    {
      name: "fe-akuntansi",
      script: "node_modules/.bin/next",
      args: "start -p 5173",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5173,
        // Backend URL used by Next.js server-side rewrite proxy
        BACKEND_URL: "http://localhost:3333",
        // Empty string = use relative /api/... paths → goes through Next.js rewrite proxy
        NEXT_PUBLIC_API_BASE_URL: "",
      },
    },
  ],
};
