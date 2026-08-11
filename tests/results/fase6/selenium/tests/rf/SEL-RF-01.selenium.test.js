import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-01: catálogo público", withEvidence("SEL-RF-01", rfCases["RF-01"]));
