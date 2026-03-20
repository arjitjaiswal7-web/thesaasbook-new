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
