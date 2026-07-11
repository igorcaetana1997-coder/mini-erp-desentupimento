import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "real-leader",
  project: "javascript-nextjs",
  silent: true,
  disableLogger: true,
});
