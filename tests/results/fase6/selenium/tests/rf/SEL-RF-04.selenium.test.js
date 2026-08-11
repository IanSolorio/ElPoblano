import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-04: inicio y cierre de sesión", withEvidence("SEL-RF-04", rfCases["RF-04"]));
