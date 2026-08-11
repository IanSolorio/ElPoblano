import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-12: retirar productos", withEvidence("SEL-RF-12", rfCases["RF-12"]));
