import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thesaasbook.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.thesaasbook.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "thesaasbook.com",
          },
        ],
        destination: "https://www.thesaasbook.com/:path*",
        permanent: true,
      },
      {
        source: "/guide/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/strategies/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/pricing/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/product-development/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/sales-and-marketing/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/categories",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/category/:slug*",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/calculators",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/growth-calculator",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/growth-calculator/:slug*",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/marketing-calculators",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/marketing-calculators/:slug*",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/ppc-calculator",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/ppc-calculator/:slug*",
        destination: "/tools",
        permanent: true,
      },
      {
        source: "/resources",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/resources/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/contact-us",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/terms-and-conditions",
        permanent: true,
      },
      {
        source: "/pdf-tools",
        destination: "/tools/pdf-tools",
        permanent: true,
      },
      {
        source: "/pdf-tools/:slug",
        destination: "/tools/pdf-tools/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
