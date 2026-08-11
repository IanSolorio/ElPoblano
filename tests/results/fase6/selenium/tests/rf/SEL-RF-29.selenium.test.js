import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-29: ranking de ventas", withEvidence("SEL-RF-29", rfCases["RF-29"]));
