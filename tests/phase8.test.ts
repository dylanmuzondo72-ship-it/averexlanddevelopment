import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAX_MEDIA_BYTES, mediaMetadataPatch, validMediaFile } from "../lib/dashboard/land-media-validation";
const read = (p: string) => readFileSync(p, "utf8");
const form = (entries: Record<string, string>) => { const f = new FormData(); Object.entries(entries).forEach(([k,v])=>f.set(k,v)); return f; };
describe("Land media integrity", () => {
  it("keeps media private and ownership constrained", () => {
    const sql=read("supabase/migrations/20260824100000_phase_8_land_media_documents.sql");
    expect(sql).toContain("single_parent"); expect(sql).toContain("public=false");
  });
  it("preserves approval and visibility when saving an image edit", () => {
    const patch=mediaMetadataPatch(form({caption:"New",rotation:"90",zoom:"2",x:"30",y:"-20"}));
    expect(patch).toEqual({caption:"New",rotation:90,crop_data:{zoom:2,x:30,y:-20}});
    expect(patch).not.toHaveProperty("visibility"); expect(patch).not.toHaveProperty("approval_status");
  });
  it("preserves the image transform when saving metadata alone", () => {
    expect(mediaMetadataPatch(form({caption:"New",visibility:"internal",approval:"pending"}))).toEqual({caption:"New",visibility:"internal",approval_status:"pending"});
  });
  it.each(["NaN","Infinity","999"])('rejects invalid crop number %s', value => {
    expect(()=>mediaMetadataPatch(form({rotation:"0",zoom:value,x:"0",y:"0"}))).toThrow();
  });
  it("rejects invalid enum values",()=>expect(()=>mediaMetadataPatch(form({approval:""}))).toThrow());
  it("accepts matching PDF signatures and rejects document-to-image replacement",async()=>{
    const pdf=new File(["%PDF-1.7\n"],"document.pdf",{type:"application/pdf"});
    expect(await validMediaFile(pdf,true)).toBe(true); expect(await validMediaFile(pdf,false)).toBe(false);
    const image=new File([new Uint8Array([255,216,255,0])],"a.jpg",{type:"image/jpeg"});
    expect(await validMediaFile(image,false)).toBe(true); expect(await validMediaFile(image,true)).toBe(false);
  });
  it("rejects MIME spoofing and oversized bodies",async()=>{
    expect(await validMediaFile(new File(["<html>"],"bad.pdf",{type:"application/pdf"}),true)).toBe(false);
    expect(await validMediaFile(new File([new Uint8Array(MAX_MEDIA_BYTES+1)],"big.jpg",{type:"image/jpeg"}),false)).toBe(false);
  });
  it("integrates private media panels",()=>{
    expect(read("components/dashboard/land/LandMediaPanel.tsx")).toContain("createSignedUrl");
    expect(read("app/dashboard/land/developments/[id]/page.tsx")).toContain("LandMediaPanel");
    expect(read("app/dashboard/land/units/[id]/page.tsx")).toContain("LandMediaPanel");
  });
});
