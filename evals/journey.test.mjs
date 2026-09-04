import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Script, runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function functionSource(name) {
  const start = html.indexOf("function " + name + "(");
  assert.ok(start >= 0, name);
  let candidate = "";
  for (const line of html.slice(start).split("\n")) {
    candidate += line + "\n";
    try {
      new Script("(" + candidate + ")");
      return candidate;
    } catch {}
  }
  throw new Error("Could not extract function: " + name);
}

test("inline scripts parse", () => {
  for (const [, source] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(source);
});

test("fallback provides a clinic link while user input remains text", () => {
  const messages = [];
  const context = { FB: "fallback", document: { getElementById: () => ({ appendChild: (item) => messages.push(item) }),
    createElement: () => ({ children: [], appendChild(child) { this.children.push(child); } }) } };
  runInNewContext(functionSource("say") + '\nsay("fallback", "b"); say("<img src=x>", "u")', context);
  assert.equal(messages[0].children[0].href, "https://wa.me/5531999395563");
  assert.equal(messages[1].textContent, "<img src=x>");
  assert.equal(messages[1].children.length, 0);
});
