import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-27: secuencia de entrega", withEvidence("SEL-RF-27", rfCases["RF-27"]));
