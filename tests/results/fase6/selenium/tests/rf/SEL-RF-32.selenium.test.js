import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-32: cancelar y restituir stock", withEvidence("SEL-RF-32", rfCases["RF-32"]));
