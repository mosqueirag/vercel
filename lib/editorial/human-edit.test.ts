import { describe, expect, it } from "vitest";
import { changedHumanEditFields, humanEditHash, sameHumanEdit, validateHumanEdit } from "./human-edit";
describe("human editorial edit", () => {
  it("trims complete plain-text edits and hashes them", () => { const edit=validateHumanEdit({title:" T ",summary:" S ",content:" C "}); expect(edit).toEqual({title:"T",summary:"S",content:"C"}); expect(humanEditHash(edit!)).toHaveLength(64); });
  it("rejects incomplete edits", () => expect(validateHumanEdit({title:"T",summary:"",content:"C"})).toBeNull());
  it("detects no-op edits and lists only changed fields", () => {
    const before = { title: "Título", summary: "Resumen", content: "Contenido" };
    expect(sameHumanEdit(before, { ...before })).toBe(true);
    expect(changedHumanEditFields(before, { ...before, summary: "Nuevo resumen", content: "Nuevo contenido" })).toEqual(["summary", "content"]);
  });
});
