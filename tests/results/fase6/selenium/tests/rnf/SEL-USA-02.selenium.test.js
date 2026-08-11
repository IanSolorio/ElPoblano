import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-USA-02: producto al carrito en sesenta segundos", withEvidence("SEL-USA-02", rnfCases["USA-02"]));
