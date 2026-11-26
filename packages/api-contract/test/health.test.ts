import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "../src/health.js";

describe("HealthResponseSchema", () => {
	it("REQ-003 AC-07: HealthResponseSchema accepts the initial health response", () => {
		expect(
			Value.Check(HealthResponseSchema, { apiVersion: 1, capabilities: [] }),
		).toBe(true);
	});

	it("REQ-003 AC-07: HealthResponseSchema accepts an added capability and field", () => {
		expect(
			Value.Check(HealthResponseSchema, {
				apiVersion: 1,
				capabilities: ["x"],
				extra: true,
			}),
		).toBe(true);
	});

	it.each([
		{ apiVersion: 0, capabilities: [] },
		{ apiVersion: 1.5, capabilities: [] },
		{ apiVersion: 1, capabilities: [1] },
		{ capabilities: [] },
		{ apiVersion: 1 },
	])("REQ-003 AC-07: HealthResponseSchema rejects %j", (response) => {
		expect(Value.Check(HealthResponseSchema, response)).toBe(false);
	});
});
