'use strict';

var xmlData_1_2 =
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        + "<VOTABLE xmlns=\"http://www.ivoa.net/xml/VOTable/v1.2\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" version=\"1.2\">\n"
        + "  <RESOURCE>\n"
        + "    <TABLE>\n"
        + "      <FIELD name=\"Job ID\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"User\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"Started\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"Status\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"Command\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"VM Type\" datatype=\"char\" arraysize=\"*\" />\n"
        + "      <FIELD name=\"CPUs\" datatype=\"int\" />\n"
        + "      <FIELD name=\"Memory\" datatype=\"long\" />\n"
        + "      <FIELD name=\"Job Starts\" datatype=\"int\" />\n"
        + "      <DATA>\n"
        + "        <TABLEDATA>\n"
        + "          <TR>\n"
        + "            <TD>735.0</TD>\n"
        + "            <TD>jenkinsd</TD>\n"
        + "            <TD />\n"
        + "            <TD>Idle</TD>\n"
        + "            <TD>sleep</TD>\n"
        + "            <TD>Tomcat</TD>\n"
        + "            <TD>1</TD>\n"
        + "            <TD>3072</TD>\n"
        + "            <TD>0</TD>\n"
        + "          </TR>\n"
        + "          <TR>\n"
        + "            <TD>734.0</TD>\n"
        + "            <TD>jenkinsd</TD>\n"
        + "            <TD />\n"
        + "            <TD>Idle</TD>\n"
        + "            <TD>sleep</TD>\n"
        + "            <TD>Tomcat</TD>\n"
        + "            <TD>1</TD>\n"
        + "            <TD>3072</TD>\n"
        + "            <TD>0</TD>\n"
        + "          </TR>\n"
        + "        </TABLEDATA>\n"
        + "      </DATA>\n"
        + "    </TABLE>\n"
        + "    <INFO name=\"STUFF\" value=\"INFO_TEXT\" />\n"
        + "  </RESOURCE>\n"
        + "</VOTABLE>";

var xmlData_1_3 =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
  + "<VOTABLE xmlns=\"http://www.ivoa.net/xml/VOTable/v1.3\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" version=\"1.3\">\n"
  + "  <RESOURCE>\n"
  + "    <TABLE>\n"
  + "      <FIELD name=\"Job ID\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"User\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"Started\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"Status\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"Command\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"VM Type\" datatype=\"char\" arraysize=\"*\" />\n"
  + "      <FIELD name=\"CPUs\" datatype=\"int\" />\n"
  + "      <FIELD name=\"Memory\" datatype=\"long\" />\n"
  + "      <FIELD name=\"Job Starts\" datatype=\"int\" />\n"
  + "      <DATA>\n"
  + "        <TABLEDATA>\n"
  + "          <TR>\n"
  + "            <TD>735.0</TD>\n"
  + "            <TD>jenkinsd</TD>\n"
  + "            <TD />\n"
  + "            <TD>Idle</TD>\n"
  + "            <TD>sleep</TD>\n"
  + "            <TD>Tomcat</TD>\n"
  + "            <TD>1</TD>\n"
  + "            <TD>3072</TD>\n"
  + "            <TD>0</TD>\n"
  + "          </TR>\n"
  + "          <TR>\n"
  + "            <TD>734.0</TD>\n"
  + "            <TD>jenkinsd</TD>\n"
  + "            <TD />\n"
  + "            <TD>Idle</TD>\n"
  + "            <TD>sleep</TD>\n"
  + "            <TD>Tomcat</TD>\n"
  + "            <TD>1</TD>\n"
  + "            <TD>3072</TD>\n"
  + "            <TD>0</TD>\n"
  + "          </TR>\n"
  + "        </TABLEDATA>\n"
  + "      </DATA>\n"
  + "    </TABLE>\n"
  + "    <INFO name=\"STUFF\" value=\"INFO_TEXT\" />\n"
  + "  </RESOURCE>\n"
  + "</VOTABLE>";

global.jQuery = require('jquery');
global.$ = global.jQuery;

var xmldom = require('xmldom');
var assert = require('assert');
// var opencadcVOTable = require('../js/cadc.votable');
var opencadcVOTableReader = require('../js/cadc.votable-reader');

describe ('XPath resolution', function()
{
  // VOTABLE 1.3
  var xmlDOM13 = (new xmldom.DOMParser()).parseFromString(xmlData_1_3, "text/xml");

  var testSubject13 = new opencadcVOTableReader._test.XPathEvaluator(xmlDOM13,
    "votable", "http://www.ivoa.net/xml/VOTable/v1.3");

  it('Check 1.3 resolution.', function ()
  {
    var result1 = testSubject13.evaluate("/VOTABLE/RESOURCE[1]/INFO");

    assert.equal(result1.length, 1);
    assert.equal(result1[0].getAttribute("name"), "STUFF");
    assert.equal(result1[0].getAttribute("value"), "INFO_TEXT");
  });

  // VOTABLE 1.2
  var xmlDOM_1_2 = (new xmldom.DOMParser()).parseFromString(xmlData_1_2,
                                                            "text/xml");

  it('Check 1.2 resolution.', function ()
  {
    var testSubject12 = new opencadcVOTableReader._test.XPathEvaluator(xmlDOM_1_2,
      "votable", "http://www.ivoa.net/xml/VOTable/v1.2");

    var result2 = testSubject12.evaluate("/VOTABLE/RESOURCE[1]/INFO");

    assert.equal(result2.length, 1);
    assert.equal(result2[0].getAttribute("name"), "STUFF");
    assert.equal(result2[0].getAttribute("value"), "INFO_TEXT");
  });
});

describe("Read in simple VOTable.", function ()
{
  var xmlDOM = (new xmldom.DOMParser()).parseFromString(xmlData_1_2,
                                                        "text/xml");

  try
  {
    // Create a DOM to pass in.
    var voTableBuilder =
      new opencadcVOTableReader._test.VOTableXMLBuilder(
        {data: xmlDOM, defaultNamespace: "http://www.ivoa.net/xml/VOTable/v1.2"});

    voTableBuilder.build();

    it('Should be one resource.', function ()
    {
      assert.equal(1, voTableBuilder.getVOTable().getResources().length);
    });

    it ('Check first table.', function ()
    {
      var firstTableObject =
        voTableBuilder.getVOTable().getResources()[0].getTables()[0];
      assert.equal(9, firstTableObject.getFields().length);
      assert.equal(2, firstTableObject.getTableData().getRows().length);
    });

    it('Check first row.', function ()
    {
      var firstTableObject =
        voTableBuilder.getVOTable().getResources()[0].getTables()[0];
      var firstRow = firstTableObject.getTableData().getRows()[0];
      assert.equal('jenkinsd', firstRow.getCells()[1].getValue());
      assert.ok(!isNaN(firstRow.getCells()[6].getValue())
                && (firstRow.getCells()[6].getValue() == Number(1)));
      assert.ok(!isNaN(firstRow.getCells()[7].getValue())
                && (firstRow.getCells()[7].getValue() == Number(3072)));
    });
  }
  catch (error)
  {
    console.log(error.stack);
  }
});
