import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-17: administrar administradores", withEvidence("SEL-RF-17", rfCases["RF-17"]));
