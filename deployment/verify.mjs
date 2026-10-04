import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const receipt=JSON.parse(fs.readFileSync('deployment/payload.json','utf8'));
const expected=process.env.EXPECTED_BUILD_ID || receipt.buildId;
assert.equal(receipt.buildId,expected,'Dispatch must name the locally verified build.');
assert.match(receipt.runtimeRevision,/^[a-f0-9]{40}$/);
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),stat=fs.lstatSync(file);assert.equal(stat.isSymbolicLink(),false,'No links in the Pages payload');if(stat.isDirectory())walk(file);else{assert.ok(stat.isFile());files.push(path.relative('site',file).replaceAll('\\','/'));}}}
walk('site');files.sort();assert.deepEqual(files,receipt.files.map(x=>x.path).sort(),'Only the reviewed public files may be deployed.');
let total=0;
for(const row of receipt.files){assert.ok(!row.path.split('/').some(p=>p==='..'||p.startsWith('.')));assert.doesNotMatch(row.path,/(?:answer.?key|worksheet|authoring|poster|student.?data|teacher|\.(?:pdf|docx|zip|env|pem|key)$)/i);const b=fs.readFileSync(path.join('site',row.path));assert.equal(b.length,row.bytes,row.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),row.sha256,row.path);total+=b.length;}
assert.ok(total<5*1024*1024,'Each release is limited to a small runtime payload.');
const manifest=JSON.parse(fs.readFileSync(path.join('site',receipt.manifest),'utf8'));
assert.equal(manifest.id||manifest.identifier,receipt.buildId);
assert.equal(manifest.sha||manifest.sourceRevision||manifest.revision,receipt.runtimeRevision);
assert.equal(manifest.dirty,false);
console.log('PUBLIC PAYLOAD VERIFIED '+receipt.buildId+' ('+files.length+' files, '+total+' bytes)');

const validation=JSON.parse(fs.readFileSync('deployment/LOCAL_VALIDATION.json','utf8'));
assert.equal(validation.status,'passed','Local validation must pass before publication.');
assert.equal(validation.buildId,receipt.buildId);
assert.equal(validation.runtimeRevision,receipt.runtimeRevision);
