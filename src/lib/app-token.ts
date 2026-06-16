// Opaque abuse-barrier token baked into the client bundle.
// Not a secret — just raises the cost of scripted access to /api/generate-image
// beyond simply curl-ing the endpoint with no headers.
export const APP_TOKEN = "jm_v1_8bX2pQ7rT4kLwZ9nVcF3hY6sM5dA1eR0";
export const APP_TOKEN_HEADER = "x-app-token";
