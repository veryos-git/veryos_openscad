// Copyright (C) Jonas Immanuel Frey - Licensed under GPL
// Firmware for the 28BYJ-48 minimal turntable: an ESP32 drives the stepper
// through its ULN2003 board. It opens the WiFi "veryos-turntable" without a
// password and serves one page at http://192.168.4.1 (phones open it as the
// network's sign-in page): speed, direction, start and stop, turning by an
// angle, steps per turn and starting at power on. The settings stay in flash.
//
// Wiring, all on one side of the board:
//   ULN2003 IN1 IN2 IN3 IN4 -> GPIO 14 27 26 25 on an ESP32 DevKit
//                              (ESP32-WROOM-32), 4 5 6 7 on an ESP32-S3 DevKit
//   ULN2003 +  -> VIN or 5V (5 V from USB)
//   ULN2003 -  -> GND
// Other boards: change PINS.
//
// Flash it with ../flash.js, or with the Arduino IDE: board "ESP32 Dev
// Module" or "ESP32S3 Dev Module", ESP32 core 3.x, no extra libraries.

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include "esp_timer.h"

const char *SSID = "veryos-turntable";
// An ESP32-S3 has no GPIO 25 to 27.
#if CONFIG_IDF_TARGET_ESP32S3
const int PINS[4] = {4, 5, 6, 7};
#else
const int PINS[4] = {14, 27, 26, 25};
#endif
// Half steps on IN1..IN4. Forward turns the shaft counterclockwise seen from
// above, by the datasheet's sequence.
const uint8_t SEQ[8] = {0b1000, 0b1100, 0b0100, 0b0110, 0b0010, 0b0011, 0b0001, 0b1001};
const float MAX_RPM = 15;
// It starts at up to START_RPM and speeds up by ACCEL rpm per second, so it
// does not stall.
const float START_RPM = 5;
const float ACCEL = 10;

WebServer server(80);
DNSServer dns;
Preferences prefs;
esp_timer_handle_t timer;

// Settings, kept in flash.
volatile float rpm = 2;
volatile bool ccw = false;
// Half steps per turn of the shaft: 4076 for the usual 63.68:1 gearbox, 4096
// for a 64:1 one.
volatile long stepsPerTurn = 4076;
bool autostart = false;
// State.
volatile bool running = false;
// Steps left to turn, -1 to turn until stopped.
volatile long stepsLeft = -1;
volatile float curRpm = 0;
int phase = 0;

void coils(uint8_t bits) {
  for (int i = 0; i < 4; i++) digitalWrite(PINS[i], (bits >> (3 - i)) & 1);
}

// Runs on its own timer, apart from the web server: one step, then it sets
// itself for the next. Stopped, it releases the coils and checks every 10 ms.
void tick(void *) {
  uint64_t wait = 10000;
  if (running) {
    if (curRpm == 0) curRpm = fminf(rpm, START_RPM);
    coils(SEQ[phase]);
    phase = (phase + (ccw ? 1 : 7)) % 8;
    wait = 60e6 / (curRpm * stepsPerTurn);
    curRpm = fminf(rpm, curRpm + ACCEL * wait / 1e6);
    if (stepsLeft > 0) {
      stepsLeft = stepsLeft - 1;
      if (stepsLeft == 0) running = false;
    }
  } else if (curRpm != 0) {
    coils(0);
    curRpm = 0;
  }
  esp_timer_start_once(timer, wait);
}

void save() {
  prefs.putFloat("rpm", rpm);
  prefs.putBool("ccw", ccw);
  prefs.putLong("spt", stepsPerTurn);
  prefs.putBool("auto", autostart);
}

void sendState() {
  char json[128];
  snprintf(json, sizeof json, "{\"rpm\":%.1f,\"ccw\":%d,\"running\":%d,\"spt\":%ld,\"auto\":%d}",
           (float)rpm, (bool)ccw, (bool)running, (long)stepsPerTurn, autostart);
  server.send(200, "application/json", json);
}

// /set?rpm=..&ccw=0|1&run=0|1&deg=..&spt=..&auto=0|1, each optional. Answers
// with the state; without arguments it only answers.
void handleSet() {
  if (server.hasArg("rpm")) rpm = constrain(server.arg("rpm").toFloat(), 0.1f, MAX_RPM);
  // A new direction starts slowly again.
  if (server.hasArg("ccw")) {
    ccw = server.arg("ccw") == "1";
    curRpm = 0;
  }
  if (server.hasArg("spt")) stepsPerTurn = constrain(server.arg("spt").toInt(), 100L, 100000L);
  if (server.hasArg("auto")) autostart = server.arg("auto") == "1";
  if (server.hasArg("run")) {
    stepsLeft = -1;
    running = server.arg("run") == "1";
  }
  if (server.hasArg("deg")) {
    long steps = lround(fabsf(server.arg("deg").toFloat()) / 360 * stepsPerTurn);
    if (steps > 0) {
      stepsLeft = steps;
      running = true;
    }
  }
  if (server.args() > 0) save();
  sendState();
}

const char PAGE[] PROGMEM = R"HTML(<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VeryOS turntable</title>
<style>
:root{--bg:#151B1D;--fg:#F4EFE3;--accent:#F1B84F;--dim:#3a4447}
*{box-sizing:border-box}
body{margin:0 auto;padding:16px;max-width:30rem;background:var(--bg);color:var(--fg);font:16px "DejaVu Sans Mono",monospace}
h1{font-size:1.3rem;margin:0 0 1.2rem}
h1 span{color:var(--accent)}
label{display:block;margin:1.2rem 0 .4rem}
input[type=range]{width:100%;accent-color:var(--accent)}
input[type=number]{width:6rem;padding:.5rem;font:inherit;background:var(--dim);color:var(--fg);border:0;border-radius:6px}
.row{display:flex;gap:.6rem;align-items:center;margin-top:.8rem}
button{flex:1;padding:.9rem;font:inherit;font-weight:bold;border:0;border-radius:6px;background:var(--dim);color:var(--fg)}
button.on{background:var(--accent);color:var(--bg)}
details{margin-top:1.6rem}
summary{cursor:pointer;color:var(--accent)}
p{color:#9aa3a5;font-size:.85rem}
</style></head><body>
<h1><span>VeryOS</span> turntable</h1>
<label>speed: <b id="rv"></b> rpm, <b id="tv"></b> s per turn</label>
<input type="range" id="rpm" min="0.1" max="15" step="0.1">
<div class="row"><button id="run"></button><button id="dir"></button></div>
<div class="row"><input type="number" id="deg" value="15" step="any"> degrees<button id="turn">turn</button></div>
<details><summary>settings</summary>
<label>steps per turn <input type="number" id="spt"></label>
<p>4076 for the usual 63.68:1 gearbox, 4096 for 64:1. Check: turn 360 degrees.</p>
<label><input type="checkbox" id="auto"> turn when powered on</label>
</details>
<p>Very Open Source.</p>
<script>
const $=id=>document.getElementById(id);let s={};
function speed(r){$('rv').textContent=(+r).toFixed(1);$('tv').textContent=(60/r).toFixed(1)}
// The poll only updates the start button, so it does not move the slider
// under a finger.
function show(j,poll){s=j;$('run').textContent=j.running?'stop':'start';$('run').className=j.running?'on':'';
 if(poll)return;$('rpm').value=j.rpm;speed(j.rpm);
 $('dir').textContent=j.ccw?'counterclockwise':'clockwise';
 $('spt').value=j.spt;$('auto').checked=!!j.auto}
function set(q,poll){fetch('/set?'+q).then(r=>r.json()).then(j=>show(j,poll))}
$('rpm').oninput=e=>speed(e.target.value);
$('rpm').onchange=e=>set('rpm='+e.target.value);
$('run').onclick=()=>set('run='+(s.running?0:1));
$('dir').onclick=()=>set('ccw='+(s.ccw?0:1));
$('turn').onclick=()=>set('deg='+$('deg').value);
$('spt').onchange=e=>set('spt='+e.target.value);
$('auto').onchange=e=>set('auto='+(e.target.checked?1:0));
set('');setInterval(()=>set('',1),2000);
</script></body></html>
)HTML";

void setup() {
  for (int pin : PINS) pinMode(pin, OUTPUT);
  coils(0);

  prefs.begin("turntable");
  rpm = prefs.getFloat("rpm", rpm);
  ccw = prefs.getBool("ccw", ccw);
  stepsPerTurn = prefs.getLong("spt", stepsPerTurn);
  autostart = prefs.getBool("auto", autostart);
  running = autostart;

  esp_timer_create_args_t args = {};
  args.callback = tick;
  args.name = "step";
  esp_timer_create(&args, &timer);
  esp_timer_start_once(timer, 10000);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(SSID);
  // Every name points to the ESP32, every unknown page to the page: phones
  // then show it as the network's sign-in page.
  dns.start(53, "*", WiFi.softAPIP());
  server.on("/", [] { server.send_P(200, "text/html", PAGE); });
  server.on("/set", handleSet);
  server.onNotFound([] {
    server.sendHeader("Location", "http://192.168.4.1/");
    server.send(302, "text/plain", "");
  });
  server.begin();
}

void loop() {
  dns.processNextRequest();
  server.handleClient();
}
