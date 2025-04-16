# Poker Hand Logger PWA

A progressive web application for poker players to track their hands and session statistics. This app allows you to quickly log your poker hands and track win/lose/fold statistics over time.

## Features

- Log poker hands with card ranks and suited/offsuit information
- Track win/lose/fold statistics
- Hide/show hand information for privacy
- Persistent data storage (survives page refreshes)
- Works offline
- Installable on mobile devices (iOS and Android)
- Simple, clean interface designed for one-handed operation

## Installation Instructions

### iOS (iPhone/iPad)

1. Open Safari and navigate to your app's URL
2. Tap the "Share" button (square with an arrow pointing up) at the bottom of the screen
3. Scroll down and tap "Add to Home Screen"
4. Give your app a name (default: "Poker Log")
5. Tap "Add" in the top-right corner
6. The app icon will appear on your home screen

### Android

1. Open Chrome and navigate to your app's URL
2. Tap the menu button (three dots) in the top-right corner
3. Tap "Add to Home screen"
4. Give your app a name (default: "Poker Log")
5. Tap "Add"
6. The app icon will appear on your home screen

## Usage Tips

- Select card ranks in order (first card, then second card)
- For pairs, the "offsuit" modifier is automatically selected
- For non-pairs, you can select "suited" or "offsuit" as needed
- Log the outcome (Win/Lose/Fold) after selecting your cards
- Long-press the "Clear" button to reset your statistics
- Swipe right to clear the current hand entry
- Tap "Hide" to mask your card information for privacy

## Keyboard Shortcuts

- Press `H` to toggle hide/show
- Press `C` to clear current hand
- Press `W`, `L`, or `F` to log win, lose, or fold respectively

## Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. For proper PWA testing, you'll need to serve the files from a web server

```bash
# Example using Python's built-in HTTP server
python -m http.server 8000
```

Then navigate to `http://localhost:8000` in your browser.

## License

MIT License

## Building Custom Icons

The included SVG template can be used to generate all the necessary icon sizes for your PWA. Use tools like Inkscape, Adobe Illustrator, or online converters to create PNG files of the following sizes:

- 192×192 (Android)
- 512×512 (Android)
- 180×180 (iOS)
- 167×167 (iOS iPad)
- 152×152 (iOS iPad)
- 16×16 (favicon)
- 32×32 (favicon)

Place all icons in an `icons` folder in your project root.
