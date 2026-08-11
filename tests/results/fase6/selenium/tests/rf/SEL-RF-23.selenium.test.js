import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-23: detalle operativo", withEvidence("SEL-RF-23", rfCases["RF-23"]));
