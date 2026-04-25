import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
  async headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-origin",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      const contentSecurityPolicy = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self' https://www.thesaasbook.com https://thesaasbook.com",
        "frame-ancestors 'self'",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com https://*.google-analytics.com",
        "frame-src 'self' https:",
        "worker-src 'self' blob:",
        "media-src 'self' data: blob:",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
      ].join("; ");

      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      securityHeaders.push({
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "tools.thesaasbook.com",
          },
        ],
        destination: "https://www.thesaasbook.com/tools",
        permanent: true,
      },
      {
        source: "/pdf-tools",
        has: [
          {
            type: "host",
            value: "tools.thesaasbook.com",
          },
        ],
        destination: "https://www.thesaasbook.com/tools/pdf-tools",
        permanent: true,
      },
      {
        source: "/pdf-tools/:slug*",
        has: [
          {
            type: "host",
            value: "tools.thesaasbook.com",
          },
        ],
        destination: "https://www.thesaasbook.com/tools/pdf-tools/:slug*",
        permanent: true,
      },
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
