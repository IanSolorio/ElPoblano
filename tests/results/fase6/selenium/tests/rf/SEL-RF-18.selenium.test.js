import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-18: auditoría administrativa", withEvidence("SEL-RF-18", rfCases["RF-18"]));
