import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-14: vigencia de promociones", withEvidence("SEL-RF-14", rfCases["RF-14"]));
