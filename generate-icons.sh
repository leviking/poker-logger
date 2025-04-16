#!/bin/bash

# Script to generate PWA icons from SVG template
# Requires Inkscape or ImageMagick's convert utility

# Check if Inkscape is installed
INKSCAPE=$(which inkscape)
CONVERT=$(which magick)

if [ -z "$INKSCAPE" ] && [ -z "$CONVERT" ]; then
  echo "Error: Either Inkscape or ImageMagick is required to run this script."
  echo "Please install one of them and try again."
  exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Source SVG file
SOURCE_SVG="poker-logger-icon.svg"

if [ ! -f "$SOURCE_SVG" ]; then
  echo "Error: Source SVG file '$SOURCE_SVG' not found."
  echo "Please make sure you have the SVG template in the current directory."
  exit 1
fi

echo "Generating PWA icons from $SOURCE_SVG..."

# iOS icon sizes
IOS_SIZES=("180" "167" "152" "120" "76" "60")

# Android icon sizes
ANDROID_SIZES=("512" "384" "192" "144" "96" "72" "48")

# Favicon sizes
FAVICON_SIZES=("32" "16")

# Generate iOS icons
for size in "${IOS_SIZES[@]}"; do
  echo "Generating apple-icon-${size}x${size}.png"
  
  if [ ! -z "$INKSCAPE" ]; then
    inkscape --export-filename="icons/apple-icon-${size}x${size}.png" \
             --export-width=$size --export-height=$size "$SOURCE_SVG" > /dev/null 2>&1
  else
    magick convert -background none -resize ${size}x${size} "$SOURCE_SVG" "icons/apple-icon-${size}x${size}.png"
  fi
done

# Generate Android icons
for size in "${ANDROID_SIZES[@]}"; do
  echo "Generating icon-${size}x${size}.png"
  
  if [ ! -z "$INKSCAPE" ]; then
    inkscape --export-filename="icons/icon-${size}x${size}.png" \
             --export-width=$size --export-height=$size "$SOURCE_SVG" > /dev/null 2>&1
  else
    magick convert -background none -resize ${size}x${size} "$SOURCE_SVG" "icons/icon-${size}x${size}.png"
  fi
done

# Generate favicon icons
for size in "${FAVICON_SIZES[@]}"; do
  echo "Generating favicon-${size}x${size}.png"
  
  if [ ! -z "$INKSCAPE" ]; then
    inkscape --export-filename="icons/favicon-${size}x${size}.png" \
             --export-width=$size --export-height=$size "$SOURCE_SVG" > /dev/null 2>&1
  else
    magick convert -background none -resize ${size}x${size} "$SOURCE_SVG" "icons/favicon-${size}x${size}.png"
  fi
done

# Generate favicon.ico (requires ImageMagick)
if [ ! -z "$CONVERT" ]; then
  echo "Generating favicon.ico"
  magick convert "icons/favicon-16x16.png" "icons/favicon-32x32.png" "icons/favicon.ico"
else
  echo "Warning: ImageMagick's convert utility not found. Skipping favicon.ico generation."
fi

# Generate iOS splash screens (simplified - only a few common sizes)
IOS_SPLASH=(
  "2048-2732"  # 12.9" iPad Pro
  "1668-2224"  # 10.5" iPad Pro
  "1536-2048"  # 9.7" iPad
  "1125-2436"  # iPhone X/XS
  "1242-2688"  # iPhone XS Max
  "828-1792"   # iPhone XR
  "750-1334"   # iPhone 8/7/6s/6
  "1242-2208"  # iPhone 8/7/6s/6 Plus
)

# Generate a simple splash screen template
echo "Generating splash screen template..."
cat > splash-template.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect x="12" y="8" width="40" height="48" rx="4" stroke="#000" stroke-width="2" fill="#fff"/>
  <path d="M32 26c-2.2-2-6-1.3-6 2 0 2.6 3 4.5 6 7 3-2.5 6-4.4 6-7 0-3.3-3.8-4-6-2z" fill="red"/>
</svg>
EOF

# Generate iOS splash screens if ImageMagick is available
if [ ! -z "$CONVERT" ]; then
  echo "Generating iOS splash screens..."
  
  for size in "${IOS_SPLASH[@]}"; do
    IFS='-' read -ra DIMENSIONS <<< "$size"
    WIDTH=${DIMENSIONS[0]}
    HEIGHT=${DIMENSIONS[1]}
    
    echo "Generating apple-splash-${WIDTH}-${HEIGHT}.png"
    
    magick convert -background "#282828" -gravity center \
            -resize ${WIDTH}x${HEIGHT}^ -extent ${WIDTH}x${HEIGHT} \
            "splash-template.svg" "icons/apple-splash-${WIDTH}-${HEIGHT}.png"
  done
else
  echo "Warning: ImageMagick's convert utility not found. Skipping splash screen generation."
fi

# Clean up
rm -f splash-template.svg

echo "All icons generated successfully."
echo "Generated files are in the 'icons' directory."
