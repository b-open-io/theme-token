
console.log("Checking VERCEL_OIDC_TOKEN visibility...");
if (process.env.VERCEL_OIDC_TOKEN) {
    console.log("SUCCESS: VERCEL_OIDC_TOKEN is present.");
    console.log("Token length:", process.env.VERCEL_OIDC_TOKEN.length);
} else {
    console.log("FAILURE: VERCEL_OIDC_TOKEN is missing.");
}
