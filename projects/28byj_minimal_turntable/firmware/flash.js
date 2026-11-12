// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Flashes the turntable firmware onto an ESP32 connected by USB: asks for
// the serial port and the board, then compiles ./turntable and uploads it
// with arduino-cli.
//
// Run: deno run --allow-run=arduino-cli firmware/flash.js
// Needs arduino-cli (https://arduino.github.io/arduino-cli) on the PATH. The
// script offers to install its ESP32 core.

const SKETCH = new URL("./turntable", import.meta.url).pathname;
const CORE = "esp32:esp32";
const BOARDS = [
  { name: "ESP32 DevKit, ESP32-WROOM-32 (IN1-4 on GPIO 14 27 26 25)", fqbn: "esp32:esp32:esp32" },
  { name: "ESP32-S3 DevKit (IN1-4 on GPIO 4 5 6 7)", fqbn: "esp32:esp32:esp32s3" },
];

function fail(message) {
  console.error(message);
  Deno.exit(1);
}

// Runs arduino-cli and shows its output. With capture it returns its JSON
// output instead.
async function cli(args, capture = false) {
  let result;
  try {
    result = await new Deno.Command("arduino-cli", {
      args: capture ? [...args, "--format", "json"] : args,
      stdout: capture ? "piped" : "inherit",
    }).output();
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    fail("arduino-cli is not installed: https://arduino.github.io/arduino-cli/latest/installation/");
  }
  if (!capture) return result.success;
  if (!result.success) fail(`arduino-cli ${args.join(" ")} failed.`);
  return JSON.parse(new TextDecoder().decode(result.stdout));
}

// Asks which of the items to take, Enter takes the first; one item is taken
// without asking.
function choose(what, items, label) {
  if (items.length === 1) {
    console.log(`${what}: ${label(items[0])}`);
    return items[0];
  }
  console.log(`${what}:`);
  items.forEach((item, i) => console.log(`  ${i + 1}) ${label(item)}`));
  const n = Number(prompt(`Number, 1 to ${items.length}, Enter for 1:`) || 1);
  if (!Number.isInteger(n) || n < 1 || n > items.length) fail("Nothing chosen.");
  return items[n - 1];
}

const { platforms } = await cli(["core", "list"], true);
if (!(platforms ?? []).some((platform) => platform.id === CORE && platform.installed_version)) {
  if (!confirm("The ESP32 core for arduino-cli is not installed. Download and install it now?")) Deno.exit(1);
  if (!await cli(["core", "update-index"]) || !await cli(["core", "install", CORE])) fail("Installing the ESP32 core failed.");
}

// USB serial ports first: these carry a vendor id.
const { detected_ports } = await cli(["board", "list"], true);
const ports = (detected_ports ?? [])
  .map((detected) => detected.port)
  .filter((port) => port.protocol === "serial")
  .sort((a, b) => Boolean(b.properties?.vid) - Boolean(a.properties?.vid));
if (ports.length === 0) fail("No serial port found. Connect the ESP32 with a USB data cable and run this again.");
const port = choose("Port", ports, (p) => `${p.address}  ${p.protocol_label ?? ""}`);
const board = choose("Board", BOARDS, (b) => b.name);

console.log(`\nCompiling and uploading to ${port.address} ...`);
if (!await cli(["compile", "--fqbn", board.fqbn, "--upload", "--port", port.address, SKETCH])) {
  fail(`
Upload failed.
- "Connecting ...": hold the board's BOOT button until the upload starts.
- "Permission denied" on Linux: sudo usermod -aG dialout $USER, then log in again.
- Another program holds the port, e.g. a serial monitor: close it.`);
}
console.log(`
Done. Join the WiFi "veryos-turntable" and open http://192.168.4.1`);
