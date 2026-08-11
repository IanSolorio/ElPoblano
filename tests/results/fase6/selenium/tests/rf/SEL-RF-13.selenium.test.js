import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-13: crear promociones", withEvidence("SEL-RF-13", rfCases["RF-13"]));
