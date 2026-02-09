import { describe, expect, test } from "bun:test";
import {
	checkElementOverlaps,
	resolveElementOverlaps,
	requiresMediaId,
	wouldElementOverlap,
} from "./element-utils";

type TElement = {
	id: string;
	type: "video" | "audio" | "text";
	startTime: number;
	duration: number;
};

describe("timeline element utils", () => {
	test("checkElementOverlaps returns true for intersecting segments", () => {
		const elements: TElement[] = [
			{ id: "a", type: "video", startTime: 0, duration: 5 },
			{ id: "b", type: "video", startTime: 4, duration: 3 },
		];
		expect(checkElementOverlaps({ elements: elements as any })).toBe(true);
	});

	test("checkElementOverlaps returns false for touching boundaries", () => {
		const elements: TElement[] = [
			{ id: "a", type: "video", startTime: 0, duration: 5 },
			{ id: "b", type: "video", startTime: 5, duration: 3 },
		];
		expect(checkElementOverlaps({ elements: elements as any })).toBe(false);
	});

	test("resolveElementOverlaps pushes later elements after previous end", () => {
		const elements: TElement[] = [
			{ id: "b", type: "video", startTime: 4, duration: 3 },
			{ id: "a", type: "video", startTime: 0, duration: 5 },
		];

		const resolved = resolveElementOverlaps({ elements: elements as any });
		expect(resolved[0].id).toBe("a");
		expect(resolved[0].startTime).toBe(0);
		expect(resolved[1].id).toBe("b");
		expect(resolved[1].startTime).toBe(5);
	});

	test("wouldElementOverlap honors excluded element id", () => {
		const elements: TElement[] = [
			{ id: "a", type: "video", startTime: 0, duration: 5 },
			{ id: "b", type: "video", startTime: 6, duration: 2 },
		];

		expect(
			wouldElementOverlap({
				elements: elements as any,
				startTime: 1,
				endTime: 2,
				excludeElementId: "a",
			}),
		).toBe(false);
	});

	test("requiresMediaId matches only media-backed element types", () => {
		expect(requiresMediaId({ element: { type: "video" } as any })).toBe(true);
		expect(requiresMediaId({ element: { type: "image" } as any })).toBe(true);
		expect(
			requiresMediaId({
				element: { type: "audio", sourceType: "upload" } as any,
			}),
		).toBe(true);
		expect(
			requiresMediaId({
				element: { type: "audio", sourceType: "library" } as any,
			}),
		).toBe(false);
		expect(requiresMediaId({ element: { type: "text" } as any })).toBe(false);
	});
});
