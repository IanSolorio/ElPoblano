import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-09: acceso administrativo", withEvidence("SEL-RF-09", rfCases["RF-09"]));
