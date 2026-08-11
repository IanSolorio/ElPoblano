import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-21: confirmado a preparación", withEvidence("SEL-RF-21", rfCases["RF-21"]));
