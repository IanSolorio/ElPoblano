import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-24: auditar cambio de estado", withEvidence("SEL-RF-24", rfCases["RF-24"]));
