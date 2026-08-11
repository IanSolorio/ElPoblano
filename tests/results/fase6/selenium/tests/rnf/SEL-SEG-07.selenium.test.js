import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-SEG-07: auditoría crítica", withEvidence("SEL-SEG-07", rnfCases["SEG-07"]));
