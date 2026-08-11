import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-SEG-04: revocación de sesión", withEvidence("SEL-SEG-04", rnfCases["SEG-04"]));
