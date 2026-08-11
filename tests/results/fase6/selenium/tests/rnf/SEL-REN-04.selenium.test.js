import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-REN-04: contenido principal en tres segundos", withEvidence("SEL-REN-04", rnfCases["REN-04"]));
