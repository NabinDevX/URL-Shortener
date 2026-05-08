Placement and CI notes for generated APK

Where to place the built APK

- After you build the Android app (Capacitor / Gradle), copy the generated APK into this folder as `urltinier.apk`.
- Expected final path served by Next.js: `/apk/urltinier.apk` (maps to `apps/web/public/apk/urltinier.apk`).

Typical local build path (example)

- `apps/web/android/app/build/outputs/apk/release/app-release.apk`

Quick manual copy example (Windows PowerShell):

```powershell
# from repo root
copy .\apps\web\android\app\build\outputs\apk\release\app-release.apk .\apps\web\public\apk\urltinier.apk
```

CI suggestion

- Add a CI step that, after building the Android APK, copies the artifact to `apps/web/public/apk/urltinier.apk` and uploads it as a web artifact or deploys it with your frontend hosting.

Notes

- The frontend and backend welcome pages link to `/apk/urltinier.apk` for Android browser downloads.
- When the site runs inside the Capacitor native app the download CTA is hidden (so users won't see a download button inside the installed app).
- If you change the file name, update references in `apps/web/app/(sections)/(auth)/page.tsx` and `apps/backend/public/js/welcome.js`.
