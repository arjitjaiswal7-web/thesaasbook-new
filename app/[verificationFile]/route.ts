import { NextResponse } from "next/server";

const GOOGLE_FILE_PREFIX = "google";
const GOOGLE_FILE_SUFFIX = ".html";

function getConfiguredVerificationFile() {
  return process.env.GOOGLE_SITE_VERIFICATION_FILE?.trim() || "";
}

function isGoogleVerificationFile(value: string) {
  return (
    value.startsWith(GOOGLE_FILE_PREFIX) &&
    value.endsWith(GOOGLE_FILE_SUFFIX) &&
    value.length > GOOGLE_FILE_PREFIX.length + GOOGLE_FILE_SUFFIX.length
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationFile: string }> },
) {
  const { verificationFile } = await params;
  const configuredFile = getConfiguredVerificationFile();

  if (
    !configuredFile ||
    !isGoogleVerificationFile(verificationFile) ||
    verificationFile !== configuredFile
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(`google-site-verification: ${configuredFile}`, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
