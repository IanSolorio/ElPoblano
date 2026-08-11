import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-06: registro del pedido", withEvidence("SEL-RF-06", rfCases["RF-06"]));
