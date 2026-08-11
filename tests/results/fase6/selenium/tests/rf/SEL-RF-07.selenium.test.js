import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-07: pago de prueba", withEvidence("SEL-RF-07", rfCases["RF-07"]));
