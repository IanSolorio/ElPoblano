import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-10: crear productos", withEvidence("SEL-RF-10", rfCases["RF-10"]));
