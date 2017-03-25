'use strict';

var assert = require('assert');
var opencadcVO = require('../lib/opencadc.votable');

describe('Metadata functions.', function ()
{
  var testSubject = new opencadcVO.Metadata();
  var fields = [];

  fields.push(new opencadcVO.Field('FIELD_ONE', 'FIELD1', null, null, null, null,
    new opencadcVO.Datatype('INTEGER'), '*', 'TESTFIELD1', 'TESTFIELD1'));
  fields.push(new opencadcVO.Field('FIELD_TWO', 'FIELD2', null, null, null, null,
    new opencadcVO.Datatype('INTEGER'), '*', 'TESTFIELD2', 'TESTFIELD2'));
  fields.push(new opencadcVO.Field('FIELD_THREE', 'FIELD3', null, null, null, null,
    new opencadcVO.Datatype('VARCHAR'), '18', 'TESTFIELD3', 'TESTFIELD3'));

  testSubject.setFields(fields);

  it('Field1 returned properly', function ()
  {
    var field1 = testSubject.getField('FIELD1');

    assert.equal('FIELD_ONE', field1.getName());
  });

  it('Null fields for not found.', function ()
  {
    assert.equal(null, testSubject.getField('FIELD4'));
    assert.equal(null, testSubject.getField('FIELD_TWO'));
  });
});

describe('Field insertions to Metadata.', function ()
{
  var testSubject = new opencadcVO.Metadata();

  var f1 = new opencadcVO.Field('F1', 'F1', 'UCD1', 'UTYPE1', 'UNIT1',
    null, null, null, null, 'F1');
  var f2 = new opencadcVO.Field('F2', 'F2', 'UCD2', 'UTYPE2', 'UNIT2',
    null, null, null, null, 'F2');
  var f3 = new opencadcVO.Field('F3', 'F3', 'UCD3', 'UTYPE3', 'UNIT3',
    null, null, null, null, 'F3');

  testSubject.insertField(3, f1);
  testSubject.insertField(13, f2);
  testSubject.insertField(9, f3);

  it('Field should be F1 at index 3.', function ()
  {
    var fr1 = testSubject.getFields()[3];
    assert.equal('F1', fr1.getID());
  });

  it('Field frNull should be null at 0.', function ()
  {
    var frNull = testSubject.getFields()[0];
    assert.equal(null, frNull);
  });

  it('Field should be F1 at index 13.', function ()
  {
    var fr2 = testSubject.getFields()[13];
    assert.equal('F2', fr2.getID());
  });

  it('Field should be F1 at index 9.', function ()
  {
    var fr3 = testSubject.getFields()[9];
    assert.equal('F3', fr3.getID());
  });
});

describe('XType for intervals', function ()
{
  it ('Not an interval', function ()
  {
    var testSubject = new opencadcVO.Field('FIELD_THREE', 'FIELD3', null, null,
      null, null, new opencadcVO.Datatype('VARCHAR'), '18', 'TESTFIELD3',
      'TESTFIELD3');

    assert.ok(testSubject.containsInterval() === false);
  });

  it ('Is an interval', function ()
  {
    var testSubject = new opencadcVO.Field('FIELD_FOUR', 'FIELD3',
      null, null, null, "adql:INTERVAL", new opencadcVO.Datatype('VARCHAR'),
      '18', 'TESTFIELD3', 'TESTFIELD3');

    assert.ok(testSubject.containsInterval());
  });
});
