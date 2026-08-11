import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-03: registro con dirección", withEvidence("SEL-RF-03", rfCases["RF-03"]));
