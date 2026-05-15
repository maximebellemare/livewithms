import { describe, expect, it } from "vitest";
import { deriveMeaningfulExports } from "../../../lib/legacy-integrity/human-centered-exports/deriveMeaningfulExports";
import { preserveReflectionOwnership } from "../../../lib/legacy-integrity/human-centered-exports/preserveReflectionOwnership";

describe("legacy integrity human-centered exports", () => {
  it("keeps exports meaningful without turning them into a profile dump", () => {
    const result = deriveMeaningfulExports({
      hasReflections: true,
      hasLongTermHistory: true,
      includeSupportContext: true,
    });

    expect(result.lines.join(" ").toLowerCase()).toContain("your own understanding");
    expect(result.lines.join(" ").toLowerCase()).not.toContain("dossier");
  });

  it("preserves reflection ownership language", () => {
    expect(preserveReflectionOwnership("Our data becomes a managed archive.").toLowerCase()).not.toMatch(/our data|managed archive/);
  });
});
