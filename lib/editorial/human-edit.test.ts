import { describe, expect, it } from "vitest";
import { humanEditHash, validateHumanEdit } from "./human-edit";
describe("human editorial edit", () => {
  it("trims complete plain-text edits and hashes them", () => { const edit=validateHumanEdit({title:" T ",summary:" S ",content:" C "}); expect(edit).toEqual({title:"T",summary:"S",content:"C"}); expect(humanEditHash(edit!)).toHaveLength(64); });
  it("rejects incomplete edits", () => expect(validateHumanEdit({title:"T",summary:"",content:"C"})).toBeNull());
});
