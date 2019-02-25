'use strict'

const { assert, expect } = require('chai')
global.StringUtil = require('opencadc-util').StringUtil
const { Metadata, Field, VOTable, Datatype } = require('../cadc.votable')

const xmlData =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<VOTABLE xmlns="http://www.ivoa.net/xml/VOTable/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.2">\n' +
  '  <RESOURCE>\n' +
  '    <TABLE>\n' +
  '      <DESCRIPTION>TEST VOTABLE</DESCRIPTION>\n' +
  '      <FIELD name="Job ID" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="Project" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="User" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="Started" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="Status" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="Command" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="VM Type" datatype="char" arraysize="*" />\n' +
  '      <FIELD name="CPUs" datatype="int" />\n' +
  '      <FIELD name="Memory" datatype="long" />\n' +
  '      <FIELD name="Job Starts" datatype="double" xtype="interval" arraysize="*"/>\n' +
  '      <DATA>\n' +
  '        <TABLEDATA>\n' +
  '          <TR>\n' +
  '            <TD>735.0</TD>\n' +
  '            <TD>2011.03.66.8.S</TD>\n' +
  '            <TD>m</TD>\n' +
  '            <TD />\n' +
  '            <TD>Idle</TD>\n' +
  '            <TD>ls</TD>\n' +
  '            <TD>Tomcattime</TD>\n' +
  '            <TD>1</TD>\n' +
  '            <TD>3072</TD>\n' +
  '            <TD />\n' +
  '          </TR>\n' +
  '          <TR>\n' +
  '            <TD>734.0</TD>\n' +
  '            <TD>2011.03.66.9.S</TD>\n' +
  '            <TD>hello</TD>\n' +
  '            <TD />\n' +
  '            <TD>Idle</TD>\n' +
  '            <TD>sle</TD>\n' +
  '            <TD>Tomcat</TD>\n' +
  '            <TD>1</TD>\n' +
  '            <TD>3072</TD>\n' +
  '            <TD />\n' +
  '          </TR>\n' +
  '          <TR>\n' +
  '            <TD>733.0</TD>\n' +
  '            <TD>2011.03.66.10.N</TD>\n' +
  '            <TD>there</TD>\n' +
  '            <TD />\n' +
  '            <TD>Idle</TD>\n' +
  '            <TD>s</TD>\n' +
  '            <TD>t</TD>\n' +
  '            <TD>1</TD>\n' +
  '            <TD>3072</TD>\n' +
  '            <TD>8.424999999999999E-5 1.1575E-4</TD>\n' +
  '          </TR>\n' +
  '        </TABLEDATA>\n' +
  '      </DATA>\n' +
  '    </TABLE>\n' +
  '  </RESOURCE>\n' +
  '</VOTABLE>'

// test('Test table functions.', 2, function () {
//   new cadc.vot.Builder(
//     30000,
//     {
//       xmlDOM: xmlDOM
//     },
//     function (voTableBuilder) {
//       voTableBuilder.build(voTableBuilder.buildRowData)

//       const voTable = voTableBuilder.getVOTable()
//       const metadata = voTable.getMetadata()

//       const memoryField = metadata.getField('Memory')
//       const jobStartsField = metadata.getField('Job Starts')

//       expect(memoryField.containsInterval(), 'Memory field should contain no INTERVAL').to.equal(false)

//       expect(jobStartsField.containsInterval(), 'Job Starts field should contain INTERVAL').to.equal(true)
//     },
//     function () {}
//   )
// })

// test('XType for intervals', 2, function () {
//   try {
//     new cadc.vot.Builder(
//       30000,
//       {
//         xmlDOM: xmlDOM
//       },
//       function (voTableBuilder) {
//         voTableBuilder.build(voTableBuilder.buildRowData)

//         const voTable = voTableBuilder.getVOTable()
//         const resources = voTable.getResources()

//         for (const r in resources) {
//           const tables = resources[r].getTables()
//           for (const t in tables) {
//             const tableData = tables[t].getTableData()
//             expect(tableData.getLongestValues()['Command'], 'Longest value for Command should be 3').to.equal(3)
//             expect(tableData.getLongestValues()['VM Type'], 'Longest value for VM Type should be 10').to.equal(10)
//           }
//         }
//       },
//       function () {}
//     )
//   } catch (error) {
//     console.log(error.stack)
//   }
// })

describe('Metadata tests', function () {
  it('Field insertions to Metadata.', function () {
    const testSubject = new Metadata(null, null, null, null, null, null)

    const f1 = new Field('F1', 'F1', 'UCD1', 'UTYPE1', 'UNIT1', null, null, null, null, 'F1')
    const f2 = new Field('F2', 'F2', 'UCD2', 'UTYPE2', 'UNIT2', null, null, null, null, 'F2')
    const f3 = new Field('F3', 'F3', 'UCD3', 'UTYPE3', 'UNIT3', null, null, null, null, 'F3')

    testSubject.insertField(3, f1)
    testSubject.insertField(13, f2)
    testSubject.insertField(9, f3)

    const fr1 = testSubject.getFields()[3]
    expect(fr1.getID(), 'Field should be F1 at index 3.').to.equal('F1')

    const frNull = testSubject.getFields()[0]
    expect(frNull, 'Field frNull should be null at 0.').to.be.undefined

    const fr2 = testSubject.getFields()[13]
    expect(fr2.getID(), 'Field should be F1 at index 13.').to.equal('F2')

    const fr3 = testSubject.getFields()[9]
    expect(fr3.getID(), 'Field should be F1 at index 9.').to.equal('F3')
  })

  it('Get field from metadata.', function () {
    const testSubject = new Metadata(null, null, null, null, null, null)

    const f1 = new Field('F1', 'F1', 'UCD1', 'UTYPE1', 'UNIT1', null, null, null, null, 'F1')
    const f2 = new Field('F2', 'F2', 'UCD2', 'UTYPE2', 'UNIT2', null, null, null, null, 'F2')
    const f3 = new Field('F3', 'F3', 'UCD3', 'UTYPE3', 'UNIT3', null, null, null, null, 'F3')

    testSubject.addField(f1)
    testSubject.addField(f2)
    testSubject.addField(f3)

    const resultField1 = testSubject.getField('F1')
    expect(resultField1.getID(), 'Wrong field retrieved.').to.equal(f1.getID())

    const resultField2 = testSubject.getField('F3')
    expect(resultField2.getID(), 'Wrong field retrieved.').to.equal(f3.getID())

    expect(testSubject.getField('BOGUS'), 'Wrong field retrieved.').to.be.null
    expect(testSubject.getField(null), 'Wrong field retrieved.').to.be.null
  })
})

describe('Datatype tests.', function () {
  it('Constructor test.', function () {
    expect(function () {
      new Datatype('BOGUS')
    }).to.throw('Datatype BOGUS is not a valid entry.')
  })

  it('Default value test.', function () {
    expect(new Datatype().getDatatypeValue(), 'Should default to varchar.').to.equal('varchar')
  })

  it('Numeric checks.', function () {
    expect(new Datatype().isNumeric(), 'Should not be numeric.').to.be.false
    expect(new Datatype('boolean').isNumeric(), 'Should not be numeric.').to.be.false
    expect(new Datatype('int').isNumeric(), 'Should be numeric.').to.be.true
    expect(new Datatype('FLOAT').isNumeric(), 'Should be numeric.').to.be.true
  })
})
