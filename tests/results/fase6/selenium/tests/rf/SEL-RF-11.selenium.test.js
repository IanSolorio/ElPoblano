import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-11: editar productos", withEvidence("SEL-RF-11", rfCases["RF-11"]));
