import { describe, expect, it } from "vitest";
import { derivePostReflectionRecovery } from "../../../lib/emotional-environment/recovery-moments/derivePostReflectionRecovery";
import { deriveQuietMoments } from "../../../lib/emotional-environment/recovery-moments/deriveQuietMoments";

describe("emotional environment recovery moments", () => {
  it("creates a quiet recovery moment when surfaces feel stacked", () => {
    const quiet = deriveQuietMoments("QUIET", true);
    expect(quiet?.body.toLowerCase()).toContain("shorter read");
  });

  it("keeps post-reflection recovery low pressure", () => {
    const recovery = derivePostReflectionRecovery("REFLECTIVE");
    expect(recovery.body.toLowerCase()).toContain("stay here for now");
  });
});
