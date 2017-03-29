'use strict';

var assert = require('assert');
var opencadcVO = require('../lib/opencadc.votable');

describe('Metadata functions.', function ()
{
  var testSubject = new opencadcVO.Metadata();
  var dataTypeFactory = new opencadcVO.DataTypeFactory();
  var intDataType = dataTypeFactory.createDataType('INTEGER');
  var varcharDataType = dataTypeFactory.createDataType('VARCHAR');
  var fields = [];

  fields.push(new opencadcVO.Field('FIELD_ONE', 'FIELD1', null, null, null, null, intDataType, '*', 'TESTFIELD1',
                                   'TESTFIELD1'));
  fields.push(new opencadcVO.Field('FIELD_TWO', 'FIELD2', null, null, null, null, intDataType, '*', 'TESTFIELD2',
                                   'TESTFIELD2'));
  fields.push(new opencadcVO.Field('FIELD_THREE', 'FIELD3', null, null, null, null, varcharDataType, '18',
                                   'TESTFIELD3', 'TESTFIELD3'));

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
  var dataTypeFactory = new opencadcVO.DataTypeFactory();
  var varcharDataType = dataTypeFactory.createDataType('VARCHAR');

  it('Not an interval', function ()
  {
    var testSubject = new opencadcVO.Field('FIELD_THREE', 'FIELD3', null, null, null, null, varcharDataType, '18',
                                           'TESTFIELD3', 'TESTFIELD3');

    assert.ok(testSubject.containsInterval() === false);
  });

  it('Is an interval', function ()
  {
    var testSubject = new opencadcVO.Field('FIELD_FOUR', 'FIELD3', null, null, null, "adql:INTERVAL", varcharDataType,
                                           '18', 'TESTFIELD3', 'TESTFIELD3');

    assert.ok(testSubject.containsInterval());
  });
});

describe('DataType comparisons.', function ()
{
  var dataTypeFactory = new opencadcVO.DataTypeFactory();

  it('VARCHAR DataType.', function ()
  {
    var varcharDataType = dataTypeFactory.createDataType('VARCHAR');

    assert.equal(varcharDataType.sanitize('88'), '88', 'Wrong value.');
    assert.equal(varcharDataType.sanitize(88), '88', 'Wrong value.');
    assert.equal(varcharDataType.sanitize(), '', 'Wrong value.');
    assert.equal(varcharDataType.sanitize(' '), ' ', 'Wrong value.');
    assert.equal(varcharDataType.sanitize(null), '', 'Wrong value.');

    assert.equal(varcharDataType.compare('98', '88'), 1, 'Wrong compare result.');
    assert.equal(varcharDataType.compare('88', '98'), -1, 'Wrong compare result.');
    assert.equal(varcharDataType.compare('88', '88'), 0, 'Wrong compare result.');
    assert.equal(varcharDataType.compare('88  ', '88'), 0, 'Wrong compare result.');
    assert.equal(varcharDataType.compare('88  ', '88 '), 0, 'Wrong compare result.');
  });

  it ('BOOLEAN DataType.', function ()
  {
    var booleanDataType = dataTypeFactory.createDataType('BOOLEAN');

    assert.equal(booleanDataType.sanitize(' '), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize(' tRue '), true, 'Wrong value.');
    assert.equal(booleanDataType.sanitize('6TRUE'), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize('0'), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize('88'), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize('FALSE'), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize(false), false, 'Wrong value.');
    assert.equal(booleanDataType.sanitize(undefined), false, 'Wrong value.');

    assert.equal(booleanDataType.compare('false', 'true'), -1, 'Wrong compare value.');
    assert.equal(booleanDataType.compare('true', 'false'), 1, 'Wrong compare value.');
    assert.equal(booleanDataType.compare('true', ' TRUE'), 0, 'Wrong compare value.');
    assert.equal(booleanDataType.compare(true, ' TRUE'), 0, 'Wrong compare value.');
    assert.equal(booleanDataType.compare(false, 'FALSE  '), 0, 'Wrong compare value.');
  });

  it ('INTEGER DataType.', function ()
  {
    var integerDataType = dataTypeFactory.createDataType('INT');

    assert.equal(integerDataType.sanitize('  89'), 89, 'Wrong int value.');
    assert.equal(integerDataType.sanitize('  -99.8'), -99, 'Wrong int value.');
    assert.equal(isNaN(integerDataType.sanitize('A77')), true, 'Should be NaN.');
    assert.equal(isNaN(integerDataType.sanitize('-I')), true, 'Should be NaN.');
    assert.equal(integerDataType.sanitize(8558484), 8558484, 'Wrong int value.');

    assert.equal(integerDataType.compare(76, 77), -1, 'Wrong compare value.');
    assert.equal(integerDataType.compare(76, -77), 1, 'Wrong compare value.');
    assert.equal(integerDataType.compare(80, '  80'), 0, 'Wrong compare value.');
  });

  it ('FLOAT DataType.', function ()
  {
    var floatDataType = dataTypeFactory.createDataType('adql:FLOAT');

    assert.equal(floatDataType.sanitize('  89.0'), 89.0, 'Wrong float value.');
    assert.equal(floatDataType.sanitize('  -99.8'), -99.8, 'Wrong float value.');
    assert.equal(isNaN(floatDataType.sanitize('A77')), true, 'Should be NaN.');
    assert.equal(isNaN(floatDataType.sanitize('-I')), true, 'Should be NaN.');
    assert.equal(floatDataType.sanitize(8558484.5), 8558484.5, 'Wront float value.');

    assert.equal(floatDataType.compare(76, 77.6), -1, 'Wrong compare value.');
    assert.equal(floatDataType.compare(176.44, -77), 1, 'Wrong compare value.');
    assert.equal(floatDataType.compare(80.5, '  80.5'), 0, 'Wrong compare value.');
  });
});

describe('DataTypeFactory creation.', function ()
{
  it ('StringDataType creation.', function ()
  {
    var dataTypeFactory = new opencadcVO.DataTypeFactory();

    assert.equal(dataTypeFactory.createDataType('VARCHAR').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('char').constructor.name, 'StringDataType', 'Wrong type.');

    // Default is still String type.
    assert.equal(dataTypeFactory.createDataType('BOGUS').constructor.name, 'StringDataType', 'Wrong type.');

    assert.equal(dataTypeFactory.createDataType('ADQL:CHAR').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:varchar').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('clob').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:CLOb').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:region').constructor.name, 'StringDataType', 'Wrong type.');
  });

  it ('IntegerDataType creation.', function ()
  {
    var dataTypeFactory = new opencadcVO.DataTypeFactory();

    assert.equal(dataTypeFactory.createDataType('INT').constructor.name, 'IntegerDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:INT').constructor.name, 'IntegerDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('INTeGer').constructor.name, 'IntegerDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:INTeGer').constructor.name, 'IntegerDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('BOGUSINT').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('BOGUS_INT').constructor.name, 'StringDataType', 'Wrong type.');
  });

  it ('FloatDataType creation.', function ()
  {
    var dataTypeFactory = new opencadcVO.DataTypeFactory();

    assert.equal(dataTypeFactory.createDataType('FLOAT').constructor.name, 'FloatingPointDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:FLOAT').constructor.name, 'FloatingPointDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('flOat').constructor.name, 'FloatingPointDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('adql:fLOAt').constructor.name, 'FloatingPointDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('BOGUSFLOAT').constructor.name, 'StringDataType', 'Wrong type.');
    assert.equal(dataTypeFactory.createDataType('BOGUS_FLOAT').constructor.name, 'StringDataType', 'Wrong type.');
  });
});
