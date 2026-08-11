import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-26: historial mensual", withEvidence("SEL-RF-26", rfCases["RF-26"]));
