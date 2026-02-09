import { describe, expect, test } from "bun:test";
import {
	findBookmarkIndex,
	getFrameTime,
	isBookmarkAtTime,
	removeBookmarkFromArray,
	toggleBookmarkInArray,
} from "./bookmarks";

describe("timeline bookmarks", () => {
	test("findBookmarkIndex uses tolerance for float matches", () => {
		const bookmarks = [1, 2.5, 10];
		expect(findBookmarkIndex({ bookmarks, frameTime: 2.5005 })).toBe(1);
	});

	test("isBookmarkAtTime returns true when bookmark exists", () => {
		expect(isBookmarkAtTime({ bookmarks: [0.5, 1], frameTime: 1.0002 })).toBe(
			true,
		);
	});

	test("toggleBookmarkInArray removes existing bookmark", () => {
		expect(toggleBookmarkInArray({ bookmarks: [1, 2, 3], frameTime: 2 })).toEqual(
			[1, 3],
		);
	});

	test("toggleBookmarkInArray adds and sorts bookmark", () => {
		expect(toggleBookmarkInArray({ bookmarks: [1, 3], frameTime: 2 })).toEqual([
			1, 2, 3,
		]);
	});

	test("removeBookmarkFromArray removes by tolerance", () => {
		expect(
			removeBookmarkFromArray({ bookmarks: [1, 2.5, 3], frameTime: 2.5004 }),
		).toEqual([1, 3]);
	});

	test("getFrameTime rounds to nearest frame", () => {
		expect(getFrameTime({ time: 1.234, fps: 30 })).toBe(1.2333333333333334);
	});
});
