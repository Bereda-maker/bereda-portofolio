import test from 'node:test';
import assert from 'node:assert/strict';
import {formatMajorInput,formatMinor,parseMoneyToMinor} from '../lib/finance/money';

test('Meals currency input stores exact minor units using each ISO currency exponent',()=>{
 assert.equal(parseMoneyToMinor('1.23','USD',{allowZero:true}),'123');
 assert.equal(parseMoneyToMinor('150','JPY',{allowZero:true}),'150');
 assert.equal(parseMoneyToMinor('1.234','BHD',{allowZero:true}),'1234');
 assert.equal(parseMoneyToMinor('1.2345','CLF',{allowZero:true}),'12345');
 assert.equal(formatMajorInput('150','JPY'),'150');
 assert.equal(formatMajorInput('1234','BHD'),'1.234');
 assert.equal(formatMinor('12345','CLF'),'CLF 1.2345');
 assert.throws(()=>parseMoneyToMinor('1.001','USD',{allowZero:true}));
});
