#!/usr/bin/env bash
# Opens the site as a phone so you can inspect elements, ids and selectors.
#
#   npm run inspect:ios                  # emulated iPhone 15 (WebKit) with the Playwright Inspector
#   npm run inspect:android              # emulated Pixel 7 (Chromium) with the Playwright Inspector
#   npm run inspect:ios:simulator        # Safari in the iOS Simulator (needs Xcode)
#   npm run inspect:android:emulator     # Chrome in the Android emulator (needs Android Studio)
#
# Options go after `--`: a page path, and --live to open selenium-automation.com instead of the
# local build, e.g. `npm run inspect:ios -- --live /contact`.
# Environment: IOS_DEVICE / ANDROID_DEVICE pick the emulated phone, IOS_SIMULATOR the simulator,
# ANDROID_AVD the emulator. See tests/debugging/mobile.md.
set -euo pipefail

platform="${1:-}"
shift || true
real_device=false
live=false
path="/home"
for arg in "$@"; do
  case "$arg" in
    --simulator | --emulator) real_device=true ;;
    --live) live=true ;;
    /*) path="$arg" ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done
if [[ "$platform" != ios && "$platform" != android ]]; then
  echo "Usage: $0 <ios|android> [--simulator] [--live] [/path]" >&2
  exit 2
fi

local_url="http://localhost:4173"
if $live; then base_url="https://selenium-automation.com"; else base_url="$local_url"; fi
url="$base_url$path"

# Check the simulator tools first, so a missing install fails before anything starts.
sdk="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
adb="$sdk/platform-tools/adb"
emulator="$sdk/emulator/emulator"
if $real_device && [[ "$platform" == ios ]] && ! xcrun simctl help >/dev/null 2>&1; then
  echo "The iOS Simulator needs Xcode. Install it from the App Store, open it once to finish" >&2
  echo "setup, then run: sudo xcode-select -s /Applications/Xcode.app" >&2
  exit 1
fi
if $real_device && [[ "$platform" == android ]] && [[ ! -x "$adb" || ! -x "$emulator" ]]; then
  echo "The Android emulator needs Android Studio (or set ANDROID_HOME to your Android SDK)." >&2
  echo "Install it, then create a phone in Device Manager with a Google Play or Google APIs image." >&2
  exit 1
fi

# The local build needs the preview server. Start one if it isn't running, and stop it on exit.
preview_pid=""
stop_preview() { [[ -n "$preview_pid" ]] && kill "$preview_pid" 2>/dev/null || true; }
trap stop_preview EXIT
if ! $live && ! curl -fs -o /dev/null "$local_url"; then
  if [[ ! -f frontend/build/index.html ]]; then
    echo "No build found. Run 'npm run build' first, or add --live to inspect the live site." >&2
    exit 1
  fi
  echo "Starting the preview server on $local_url"
  node_modules/.bin/vite preview --config frontend/vite.config.ts --port 4173 >/dev/null 2>&1 &
  preview_pid=$!
  for _ in $(seq 1 30); do curl -fs -o /dev/null "$local_url" && break; sleep 1; done
fi

if ! $real_device; then
  # Playwright's device emulation, with its Inspector. Click "Pick locator" and hover an element to
  # see the locator a test would use.
  if [[ "$platform" == ios ]]; then
    device="${IOS_DEVICE:-iPhone 15}"; browser=webkit
  else
    device="${ANDROID_DEVICE:-Pixel 7}"; browser=chromium
  fi
  echo "Opening $url as $device ($browser). Close the browser window to finish."
  npx playwright codegen --browser "$browser" --device "$device" "$url"
  exit 0
fi

if [[ "$platform" == ios ]]; then
  simulator="${IOS_SIMULATOR:-iPhone 15}"
  xcrun simctl boot "$simulator" 2>/dev/null || true   # already booted is fine
  open -a Simulator
  xcrun simctl openurl booted "$url"
  echo "Opened $url in Safari on the $simulator simulator."
  echo "Inspect it from your Mac's Safari: Develop > Simulator > the page."
  echo "(Turn on the Develop menu in Safari Settings > Advanced.)"
else
  if ! "$adb" devices | grep -q '^emulator-'; then
    avd="${ANDROID_AVD:-$("$emulator" -list-avds | head -n 1)}"
    if [[ -z "$avd" ]]; then
      echo "No Android emulator found. Create one in Android Studio's Device Manager." >&2
      exit 1
    fi
    echo "Starting the $avd emulator"
    "$emulator" -avd "$avd" >/dev/null 2>&1 &
    "$adb" wait-for-device
    until [[ "$("$adb" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == 1 ]]; do sleep 2; done
  fi
  # Makes localhost:4173 on the emulator reach this machine's preview server.
  "$adb" reverse tcp:4173 tcp:4173 >/dev/null
  "$adb" shell am start -a android.intent.action.VIEW -d "$url" com.android.chrome >/dev/null
  echo "Opened $url in Chrome on the emulator."
  echo "Inspect it from desktop Chrome: open chrome://inspect/#devices and click 'inspect' under the page."
fi

if [[ -n "$preview_pid" ]]; then
  echo "The preview server keeps running for the simulator. Press Ctrl+C to stop it."
  wait "$preview_pid"
fi
