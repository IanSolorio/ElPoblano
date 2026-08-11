import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-SEG-08: HTTPS sin contenido inseguro", withEvidence("SEL-SEG-08", rnfCases["SEG-08"]));
