import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-SEG-02: autorización por roles", withEvidence("SEL-SEG-02", rnfCases["SEG-02"]));
