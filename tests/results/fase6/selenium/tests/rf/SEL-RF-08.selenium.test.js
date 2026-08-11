import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-08: historial de compras", withEvidence("SEL-RF-08", rfCases["RF-08"]));
