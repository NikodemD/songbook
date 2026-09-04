# Songbook

A phone-first guitar companion: fretboard scales, a microphone tuner, popular chord progressions, a lyric/chord scanner, and imported guitar tabs. Add it to your iPhone home screen and it behaves like an app.

## On iPhone

1. Open the GitHub Pages URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Allow the microphone when you use **Tuner**, and the camera/photos when you scan a song.

Saved songs stay on the phone (IndexedDB). Nothing is uploaded.

## Features

- **Scales** — major, minor, pentatonic, blues, modes, plus world scales (Hijaz, Hungarian Gypsy, Chinese, Japanese, and more). Notes light up on a 12-fret board. Switch key, tuning, and note vs degree labels.
- **Chords** — common progressions in any key, with diagrams and a tap-to-hear preview.
- **Songs** — photograph a chord sheet or paste lyrics. OCR highlights chords and you can save the chart.
- **Tabs** — paste a public tab page URL (or the tab text). The app reads the page, keeps the tab/chords, and stores it on the phone. If a site blocks reading, copy the tab and paste it.
- **Tuner** — live pitch from the iPhone mic, with optional string targets for standard tuning.

## Local development

```bash
npm install
npm run dev
```

Then open the printed URL. For the tuner and camera, use the network URL from your phone on the same Wi-Fi, or deploy and use HTTPS.
