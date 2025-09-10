// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DATABASE_URL",
    description: "Supabase PostgreSQL database connection string for migrations and server-side operations",
    required: true,
    instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Database → Connection string (URI format).\n Copy the full postgresql:// connection string.\n Make sure to replace [YOUR-PASSWORD] with actual password"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Supabase project URL for client-side authentication and API calls",
    required: true,
    instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Data API → Copy the 'Project URL -> URL' field (format: https://[project-id].supabase.co)"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Supabase anonymous/publishable key for client-side authentication",
    required: true,
    instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API Keys → Copy 'Legacy API keys → anon public' key"
  },
  {
    name: "SMTP_HOST",
    description: "SMTP server hostname for sending emails (e.g., smtp.gmail.com, smtp.sendgrid.net)",
    required: false,
    instructions: "For Gmail: smtp.gmail.com\nFor SendGrid: smtp.sendgrid.net\nFor Mailgun: smtp.mailgun.org\nContact your email provider for the correct SMTP hostname"
  },
  {
    name: "SMTP_PORT",
    description: "SMTP server port (usually 587 for TLS or 465 for SSL)",
    required: false,
    instructions: "Common ports:\n587 (TLS/STARTTLS - recommended)\n465 (SSL)\n25 (unencrypted - not recommended)"
  },
  {
    name: "SMTP_SECURE",
    description: "Whether to use SSL for SMTP connection (true for port 465, false for port 587)",
    required: false,
    instructions: "Set to 'true' if using port 465 (SSL)\nSet to 'false' if using port 587 (TLS/STARTTLS)"
  },
  {
    name: "SMTP_USER",
    description: "SMTP username (usually your email address)",
    required: false,
    instructions: "This is typically your full email address (e.g., yourname@gmail.com)\nFor some providers, it might be just the username part"
  },
  {
    name: "SMTP_PASS",
    description: "SMTP password or app-specific password",
    required: false,
    instructions: "For Gmail: Use an App Password (not your regular password)\nFor SendGrid: Use your API key\nFor other providers: Use your email password or API key"
  },
  {
    name: "SMTP_FROM",
    description: "Email address to send emails from (optional, defaults to SMTP_USER)",
    required: false,
    instructions: "This should be a verified email address on your SMTP provider\nIf not set, will use SMTP_USER as the from address"
  },
  {
    name: "GOOGLE_CLIENT_ID",
    description: "Google OAuth 2.0 Client ID for Google Sign-In integration",
    required: false,
    instructions: "1. Go to [Google Cloud Console](https://console.cloud.google.com/)\n2. Create a new project or select existing\n3. Enable Google+ API\n4. Go to Credentials → Create Credentials → OAuth client ID\n5. Select 'Web application'\n6. Add your domain to authorized origins\n7. Add callback URL: {YOUR_DOMAIN}/api/auth/google/callback"
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth 2.0 Client Secret for Google Sign-In integration",
    required: false,
    instructions: "This is generated automatically when you create the OAuth client ID in Google Cloud Console. Keep this secret and never expose it in client-side code."
  },
  {
    name: "MICROSOFT_CLIENT_ID",
    description: "Microsoft Azure Application (client) ID for Outlook/Microsoft Sign-In",
    required: false,
    instructions: "1. Go to [Azure Portal](https://portal.azure.com/)\n2. Navigate to Azure Active Directory → App registrations\n3. Create 'New registration'\n4. Set redirect URI: {YOUR_DOMAIN}/api/auth/microsoft/callback\n5. Copy the Application (client) ID"
  },
  {
    name: "MICROSOFT_CLIENT_SECRET",
    description: "Microsoft Azure Client Secret for Outlook/Microsoft Sign-In",
    required: false,
    instructions: "1. In your Azure app registration\n2. Go to Certificates & secrets\n3. Create 'New client secret'\n4. Copy the secret value (not the ID)\n5. Note: Secret expires, set calendar reminder to renew"
  },
  {
    name: "MICROSOFT_TENANT_ID",
    description: "Microsoft Azure Directory (tenant) ID for multi-tenant support",
    required: false,
    instructions: "1. In Azure Portal → Azure Active Directory\n2. Copy the Directory (tenant) ID from the Overview page\n3. Use 'common' for multi-tenant, or specific tenant ID for single-tenant"
  },
  {
    name: "APPLE_CLIENT_ID",
    description: "Apple Sign In Service ID (identifier) for Apple authentication",
    required: false,
    instructions: "1. Go to [Apple Developer](https://developer.apple.com/account/)\n2. Certificates, Identifiers & Profiles → Identifiers\n3. Create new App ID with Sign In with Apple capability\n4. Create new Services ID, enable Sign In with Apple\n5. Configure return URLs with your callback: {YOUR_DOMAIN}/api/auth/apple/callback"
  },
  {
    name: "APPLE_TEAM_ID",
    description: "Apple Developer Team ID for Sign In with Apple",
    required: false,
    instructions: "1. Go to [Apple Developer Account](https://developer.apple.com/account/)\n2. Click on your profile/organization name\n3. Copy the Team ID (10-character alphanumeric string)\n4. This identifies your developer team"
  },
  {
    name: "APPLE_PRIVATE_KEY",
    description: "Apple Sign In Private Key (p8 file content) for token signing",
    required: false,
    instructions: "1. In Apple Developer → Certificates, Identifiers & Profiles → Keys\n2. Create new key with Sign In with Apple capability\n3. Download the .p8 file\n4. Copy entire file content including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----\n5. Replace line breaks with \\n in env variable"
  },
  {
    name: "APPLE_KEY_ID",
    description: "Apple Sign In Key ID for the private key used in token signing",
    required: false,
    instructions: "This is the 10-character Key ID shown when you create the private key in Apple Developer portal. You can find it in the key details after creation."
  },
  {
    name: "OPENAI_API_KEY",
    description: "OpenAI API key for advanced AI logo generation using DALL-E",
    required: false,
    instructions: "1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)\n2. Create account or sign in\n3. Create new API key\n4. Copy the key (starts with sk-)\n5. Note: This enables advanced AI logo generation beyond simple text-based logos"
  }
];

// SUPABASE/DATABASE VARIABLES (uncomment and add to ENV_VARIABLES array when adding database features)
// {
//   name: "DATABASE_URL",
//   description: "Supabase PostgreSQL database connection string for migrations and server-side operations",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Database → Connection string (URI format).\n Copy the full postgresql:// connection string.\n Make sure to replace [YOUR-PASSWORD] with actual password"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_URL",
//   description: "Supabase project URL for client-side authentication and API calls",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Data API → Copy the 'Project URL -> URL' field (format: https://[project-id].supabase.co)"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
//   description: "Supabase anonymous/publishable key for client-side authentication",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API Keys → Copy 'Legacy API keys → anon public' key"
// }

export interface EnvVariable {
  name: string
  description: string
  instructions: string
  required: boolean
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(envVar => envVar.required && !process.env[envVar.name]).map(envVar => envVar.name)
}