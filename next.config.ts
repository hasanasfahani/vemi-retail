import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /* The Erbil dashboard the portal replaced.

         It is still in the tree, but nothing should reach it: its gate
         bounced anyone without a stored flag to the marketing page,
         so an old bookmark did not show the previous product — it
         showed the home page, which reads as "nothing has been
         updated". Every path under it now lands in the workspace that
         replaced it. */
      { source: "/dashboard", destination: "/portal", permanent: false },
      { source: "/dashboard/:path*", destination: "/portal", permanent: false },
    ];
  },
};

export default nextConfig;
