# IRIS — International Relations Intelligent System

Measurement, diagnosis and AI-assisted management for university international
offices: partnerships, MOUs, mobility and recruitment, built around the IMG/IPI
framework.

## Get the apps

Every push builds both apps and publishes them to the
[`demo-latest` release](../../releases/tag/demo-latest):

| Platform | File | Install |
| --- | --- | --- |
| Windows | `IRIS-0.1.0-portable.exe` | Double-click. No installation; runs from a USB stick. |
| Android | `IRIS-android.apk` | Open the release page on the phone, download, tap to install. |

Both run offline with a local database. To enable Claude, open
**Settings → Cloud AI**, choose Claude and paste an API key from the Claude
Console. The key is stored only on that device.

## Develop

```sh
npm ci
npm run dev                 # web, http://localhost:8080
npm run electron:dev        # desktop shell with hot reload
npm run build && npx cap sync android   # refresh the Android project
```

- Desktop shell: `electron/` (see [electron/README.md](electron/README.md))
- Android shell: `android/` (Capacitor 8). Release signing reads the
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
  and `ANDROID_KEY_PASSWORD` repository secrets; without them CI publishes a
  debug-signed APK.
- CI: `.github/workflows/build-apps.yml`

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
