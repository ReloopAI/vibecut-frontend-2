import { describe, expect, test } from "bun:test";
import {
	formatTimeCode,
	getLastFrameTime,
	getSnappedSeekTime,
	guessTimeCodeFormat,
	parseTimeCode,
	roundToFrame,
	snapTimeToFrame,
} from "./time";

describe("time utils", () => {
	test("formatTimeCode formats HH:MM:SS:CS", () => {
		expect(formatTimeCode({ timeInSeconds: 3661.23 })).toBe("01:01:01:23");
	});

	test("formatTimeCode formats HH:MM:SS:FF with fps", () => {
		expect(
			formatTimeCode({
				timeInSeconds: 10.5,
				format: "HH:MM:SS:FF",
				fps: 30,
			}),
		).toBe("00:00:10:15");
	});

	test("parseTimeCode parses HH:MM:SS", () => {
		expect(parseTimeCode({ timeCode: "01:02:03", format: "HH:MM:SS", fps: 30 })).toBe(
			3723,
		);
	});

	test("parseTimeCode returns null for invalid MM:SS", () => {
		expect(parseTimeCode({ timeCode: "01:99", format: "MM:SS", fps: 30 })).toBe(
			null,
		);
	});

	test("guessTimeCodeFormat infers based on segment count", () => {
		expect(guessTimeCodeFormat({ timeCode: "12:34" })).toBe("MM:SS");
		expect(guessTimeCodeFormat({ timeCode: "01:02:03" })).toBe("HH:MM:SS");
		expect(guessTimeCodeFormat({ timeCode: "01:02:03:12" })).toBe(
			"HH:MM:SS:FF",
		);
	});

	test("snapTime helpers round and clamp correctly", () => {
		expect(roundToFrame({ time: 1.234, fps: 30 })).toBe(1.2333333333333334);
		expect(snapTimeToFrame({ time: 1.234, fps: 30 })).toBe(1.2333333333333334);
		expect(getSnappedSeekTime({ rawTime: -1, duration: 100, fps: 30 })).toBe(0);
		expect(getSnappedSeekTime({ rawTime: 101, duration: 100, fps: 30 })).toBe(100);
	});

	test("getLastFrameTime handles fps edge cases", () => {
		expect(getLastFrameTime({ duration: 5, fps: 25 })).toBe(4.96);
		expect(getLastFrameTime({ duration: 5, fps: 0 })).toBe(5);
		expect(getLastFrameTime({ duration: 0, fps: 25 })).toBe(0);
	});
});
