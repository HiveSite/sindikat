import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const content=JSON.parse(fs.readFileSync(new URL('../content/tours.json',import.meta.url),'utf8'));
test('sadrži svih šest gradova i kompletne slučajeve',()=>{
  assert.equal(content.tours.length,6);
  for(const tour of content.tours){
    const c=content.cases[tour.caseId];
    assert.ok(c,`Nedostaje slučaj ${tour.caseId}`);
    assert.equal(c.checkpoints.length,5,`${tour.city} mora imati 5 stanica`);
    assert.equal(c.sidequests.length,5,`${tour.city} mora imati 5 bonusa`);
    assert.equal(c.events.length,5,`${tour.city} mora imati 5 događaja`);
    assert.ok(c.arc.question&&c.arc.truth&&c.finale);
    for(const cp of c.checkpoints){
      assert.ok(Number.isFinite(cp.lat)&&Number.isFinite(cp.lng));
      assert.ok(cp.question&&cp.hint&&cp.evidence?.title&&cp.evidence?.copy);
      if(cp.type==='choice')assert.ok(Array.isArray(cp.options)&&cp.options.length>=2);
    }
  }
});
