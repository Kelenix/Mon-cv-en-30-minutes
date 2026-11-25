import { describe, expect, it } from "vitest";
import {
  decodeArrival,
  encodeArrival,
  referralCode,
} from "@/features/acquisition/cookies";

// Cookies du plan d'acquisition (ADR-052) : provenance et code d'invitation relus sans confiance.
describe("provenance gardée en cookie", () => {
  it("relit ce qu'elle a écrit", () => {
    const visit = { channel: "search", source: "google" } as const;
    expect(decodeArrival(encodeArrival(visit))).toEqual(visit);
    expect(
      decodeArrival(
        encodeArrival({ channel: "campaign", source: "parrainage" }),
      ),
    ).toEqual({ channel: "campaign", source: "parrainage" });
  });

  it("ignore une valeur absente ou modifiée à la main", () => {
    for (const value of [
      undefined,
      "",
      "search",
      "pirate~google",
      "search~Google",
      "search~google~x",
      "search~<script>",
      `search~${"a".repeat(61)}`,
    ]) {
      expect(decodeArrival(value)).toBeNull();
    }
  });
});

describe("code d'invitation", () => {
  it("accepte 8 lettres ou chiffres, en minuscules", () => {
    expect(referralCode(" AB12cd34 ")).toBe("ab12cd34");
  });

  it("refuse le reste", () => {
    for (const value of [null, 12345678, "abc", "ab12cd345", "ab12-d34"]) {
      expect(referralCode(value)).toBeNull();
    }
  });
});
