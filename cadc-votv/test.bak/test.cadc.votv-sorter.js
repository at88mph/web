'use strict';

var xmlData =
  '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n'
  +
  '<VOTABLE xmlns=\'http://www.ivoa.net/xml/VOTable/v1.2\' xmlns:xsi=\'http://www.w3.org/2001/XMLSchema-instance\' version=\'1.2\'>\n'
  + '  <RESOURCE type=\'results\'>\n'
  + '    <TABLE>\n'
  + '      <DESCRIPTION>TEST VOTABLE</DESCRIPTION>\n'
  + '      <FIELD name=\'Job ID\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'Project\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'User\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'Started\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'Status\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'Command\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'VM Type\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'CPUs\' datatype=\'int\' />\n'
  + '      <FIELD name=\'Memory\' datatype=\'long\' />\n'
  + '      <FIELD name=\'Job Starts\' datatype=\'int\' />\n'
  + '      <FIELD name=\'RA\' datatype=\'double\' />\n'
  + '      <FIELD id=\'Dec\' name=\'Dec\' datatype=\'double\' />\n'
  + '      <FIELD name=\'Calibration Level\' datatype=\'int\' />\n'
  + '      <DATA>\n'
  + '        <TABLEDATA>\n'
  + '          <TR>\n'
  + '            <TD>735.0</TD>\n'
  + '            <TD>2011.03.66.8.S</TD>\n'
  + '            <TD>m</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>ls</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>350.8923046994408</TD>\n'
  + '            <TD>33.496328250076225</TD>\n'
  + '            <TD>-1</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>734.0</TD>\n'
  + '            <TD>2011.03.66.9.S</TD>\n'
  + '            <TD>hello</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>sle</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>41.63295047803702</TD>\n'
  + '            <TD>-56.008253196459115</TD>\n'
  + '            <TD>0</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>s</TD>\n'
  + '            <TD>BLASTabell31122006-12-21</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>41.63295047803702</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>3</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>s</TD>\n'
  + '            <TD>BLASTgoods-s2006-12-21</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>-45.4232993571047</TD>\n'
  + '            <TD></TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>s</TD>\n'
  + '            <TD>abell3112</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>189.08577100000196</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>0</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>s</TD>\n'
  + '            <TD>goods-s</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>76.76871277764876</TD>\n'
  + '            <TD>-45.4232993571047</TD>\n'
  + '            <TD>0</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>s</TD>\n'
  + '            <TD>goods-s</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD></TD>\n'
  + '            <TD>0.0</TD>\n'
  + '            <TD>0.0</TD>\n'
  + '            <TD>0</TD>\n'
  + '          </TR>\n'
  + '        </TABLEDATA>\n'
  + '      </DATA>\n'
  + '    </TABLE>\n'
  + '  </RESOURCE>\n'
  + '</VOTABLE>';

global.jQuery = require('jquery');
global.$ = global.jQuery;
var window = {};
global.window = window;

var xmldom = require('xmldom');
var assert = require('assert');

var opencadcVOComparer = require('../opencadc-votable-compare-engine/lib/opencadc.votable-compare-engine.js');
var opencadcVOViewer = require('../lib/opencadc.votv-viewer');

// Create a DOM to pass in.
var xmlDOM = (new xmldom.DOMParser()).parseFromString(xmlData, 'text/xml');

var targetNode = document.createElement('div');
targetNode.setAttribute('id', 'myGrid');

document.body.appendChild(targetNode);

// Create the options for the Grid.
var options = {
  editable: false,
  enableAddRow: false,
  showHeaderRow: true,
  enableCellNavigation: true,
  asyncEditorLoading: true,
  forceFitColumns: false,
  explicitInitialization: true,
  topPanelHeight: 45,
  headerRowHeight: 45,
  showTopPanel: false,
  sortColumn: 'Job ID',
  sortDir: 'asc',
  columnOptions: {
    'User': {
      cssClass: 'user_column'
    },
    'Started': {
      cssClass: 'started_on_column'
    }
  }
};


function testComparers(columnOfInterest, expectedArray, direction)
{
  // test setup
  options.sortColumn = columnOfInterest;
  options.sortDir = direction;

  var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

  viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
  {
    // viewer.render();

    var dataView = viewer.getGrid().getData();
    var column = viewer.getColumn(columnOfInterest);
    var comp = new opencadcVOComparer.Comparer(columnOfInterest,
      column.datatype.isNumeric());

    // execute the test
    dataView.sort(comp.compare, (direction === 'asc'));

    // extract the result into something easy to compare
    //
    var testArray = [];
    for (var jj = 0, dvl = dataView.getLength(); jj < dvl; jj++)
    {
      var kk = dataView.getItem(jj)[columnOfInterest];
      testArray.push(kk);
      if (expectedArray[jj].length === 0)
      {
        if (column.datatype.isNumeric())
        {
          assert.ok(isNaN(kk), 'Expected NaN, got ' + kk);
        }
        else
        {
          assert.ok((kk.length === 0), 'Expected length === 0, got ' + kk);
        }
      }
      else if (kk.length != 0 && expectedArray[jj].length != 0)
      {
        assert.equal(kk, expectedArray[jj]);
      }
    }
  });

  viewer.build({
                 type: 'xml',
                 data: xmlDOM,
                 defaultNamespace: 'http://www.ivoa.net/xml/VOTable/v1.2'
               });
}

describe('Sort asc dec.', function ()
{
  it('Ascending Dec.', function ()
  {
    var expectedArray = ['', '', '-56.008253196459115', '-45.4232993571047',
                         '-45.4232993571047', '0', '33.496328250076225'];
    testComparers('Dec', expectedArray, 'asc');
  });
});


describe('Sort asc ra class.', function ()
{
  it('Ascending RA.', function ()
  {

    var expectedArray = ['', '0', '41.63295047803702', '41.63295047803702',
                         '76.76871277764876', '189.08577100000196',
                         '350.8923046994408'];
    testComparers('RA', expectedArray, 'asc');
  });
});

describe('Sort desc string', function ()
{
  it('Descending String.', function ()
  {

    var expectedArray = ['goods-s', 'goods-s', 'abell3112',
                         'BLASTgoods-s2006-12-21', 'BLASTabell31122006-12-21',
                         '', ''];
    testComparers('VM Type', expectedArray, 'desc');
  });
});

describe('Sort desc number failure.', function ()
{
  it('Descending number failure.', function ()
  {

    //
    // when the underlying value is a converted to a number, Number.NaN is
    // returned.
    var expectedArray = ['goods-s', 'goods-s', 'abell3112',
                         'BLASTgoods-s2006-12-21', 'BLASTabell31122006-12-21',
                         '',
                         ''];
    testComparers('VM Type', expectedArray, 'desc');
  });
});
