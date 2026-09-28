import assert from 'node:assert/strict';
import {BOARD_POSITIONS,createRevealBoard} from './reveal-board.js';

class Element {
  constructor(tag='div'){this.tag=tag;this.children=[];this.attributes={};this.dataset={};this.classes=new Set();this.classList={add:(...x)=>x.forEach(v=>this.classes.add(v)),remove:(...x)=>x.forEach(v=>this.classes.delete(v)),contains:x=>this.classes.has(x)};this.textContent=''}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children}
  setAttribute(key,value){this.attributes[key]=value}
}
globalThis.document={createElement:tag=>new Element(tag)};
globalThis.matchMedia=()=>({matches:true});
const host=new Element(),progress=[],details=[];
const people=Array.from({length:9},(_,i)=>({name:`Person ${i+1}`,imageUrl:`https://example.org/${i+1}.jpg`,sourceUrl:'https://example.org/profile'}));
const board=createRevealBoard(host,people,{onProgress:(rank)=>progress.push(rank),onDetail:(rank)=>details.push(rank)});
assert.deepEqual(host.children.map(c=>Number(c.dataset.rank)),BOARD_POSITIONS);
assert.ok(host.children.every(c=>c.disabled&&c.children[2].textContent===''&&c.children[0].children.length===0));
board.showAll();
assert.deepEqual(progress,[9,8,7,6,5,4,3,2,1]);
assert.ok(host.classList.contains('is-final'));
for(const rank of BOARD_POSITIONS){const c=host.children.find(x=>Number(x.dataset.rank)===rank);assert.equal(c.children[2].textContent,`Person ${rank}`);assert.equal(c.disabled,false)}
host.children.find(x=>x.dataset.rank==='1').onclick();assert.deepEqual(details,[1]);
const host2=new Element(),sequence=[];
const board2=createRevealBoard(host2,people,{onProgress:rank=>sequence.push(rank)});
await board2.play();
assert.deepEqual(sequence,[9,8,7,6,5,4,3,2,1]);
assert.ok(board2.finished);
console.log('Unified board positions, veil, order, detail and reduced-motion completion PASS');
