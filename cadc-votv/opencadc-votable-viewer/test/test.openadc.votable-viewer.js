/*
 * Created by goliaths on 06/08/15.
 */

var xmlData =
  '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n'
  + '<VOTABLE xmlns=\'http://www.ivoa.net/xml/VOTable/v1.2\' xmlns:xsi=\'http://www.w3.org/2001/XMLSchema-instance\' version=\'1.2\'>\n'
  + '  <RESOURCE>\n'
  + '    <TABLE>\n'
  + '      <FIELD name=\'Job ID\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <FIELD name=\'Project\' datatype=\'char\' arraysize=\'*\' />\n'
  + '      <DATA>\n'
  + '        <TABLEDATA>\n'
  + '          <TR>\n'
  + '            <TD>735.0</TD>\n'
  + '            <TD>2011.03.66.8.S</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>734.0</TD>\n'
  + '            <TD>2011.03.66.9.S</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '          </TR>\n'
  + '        </TABLEDATA>\n'
  + '      </DATA>\n'
  + '    </TABLE>\n'
  + '  </RESOURCE>\n'
  + '</VOTABLE>';

var assert = require('assert');
var $ = jQuery = require('jquery');
// $.ui = require('jquery-ui');
var DOMParser = require('xmldom').DOMParser;
var stringUtil = new require('opencadc-util').StringUtil();
var opencadcVOTV = require('../lib/opencadc.votable-viewer');
var Slick = require('slickgrid/slick.core-npm');
Slick.Data = require('slickgrid/slick.dataview-npm');
Slick.Grid = require('slickgrid/slick.grid-npm');

// Create a DOM to pass in.
var xmlDOM = new DOMParser().parseFromString(xmlData, 'text/xml');

function createTestDOM()
{
  var y = document.createElement('div');
  y.setAttribute('id', 'myOtherGrid');

  var node = document.createElement('div');
  node.setAttribute('id', 'myGrid');
  document.body.appendChild(y);
  document.body.appendChild(node);

  var $prevMyGrid = $('#myOtherGrid');
  var $node3 = $('<img src=\'abc.gif\' alt=\'test image\' class=\'grid-header-icon\'/>');
  $prevMyGrid.append($node3);
  $node3 = $('<div class=\'grid-header-label\'/>');
  $prevMyGrid.append($node3);
}

// Create the options for the Grid.
var options = {
  editable: false,
  pager: false,
  maxRowLimitWarning: 'too many',
  maxRowLimit: -1
};


describe('Results page start/end events, over-ridden and default results.', function ()
{
  var sttic = function (count1, count2)
  {
    return 'Showing ' + count1 + ' of ' + count2 + ' rows. ';
  };

  var msgFn = function (msg)
  {
    assert.ok(true, 'atDataLoadComplete over-ridden function called');
    return function (c1, c2, $label)
    {
      var newMessage = msg(c1, c2);
      $label.text(newMessage);
    }
  };

  // check an over-ridden implementation
  options.atDataLoadComplete = msgFn(sttic);

  createTestDOM();

  it('Build a viewer.', function ()
  {
    var viewer = new opencadcVOTV.Viewer('#myGrid', options);
    viewer.build({
        type: 'xml',
        data: xmlDOM
      },
      function ()
      {
        // empty
      },
      function ()
      {
        console.log('Error while building.');
      }
    );

    // non-default implementations after event triggering

    var $myGrid = $('#myGrid');
    var $prevMyGrid = $('#myOtherGrid');

    $myGrid.trigger(viewer.events.onDataLoadComplete);

    var $result = $myGrid.prev().css('background-color');
    equal('rgba(0, 0, 0, 0)', $result, 'non-default background color checked');

    $result = $prevMyGrid.find('img').attr('src');
    assert.ok(stringUtil.endsWith($result, '.png'),
      'non-default file name checked - un-changed from initial');

    $result = $prevMyGrid.find('.grid-header-label').text();
    assert.ok(stringUtil.endsWith($result, 'rows. '),
      'non-default row limit warning text checked');

    // default options
    options.atDataLoadComplete = undefined;
    options.atPageInfoChanged = undefined;

    viewer = new cadc.vot.Viewer('#myGrid', options);
    viewer.build({
        xmlDOM: xmlDOM
      },
      function ()
      {
        // empty
      },
      function ()
      {
        console.log('Error while building.');
      }
    );

    $myGrid.trigger(viewer.events.onDataLoadComplete);

    $result = $myGrid.prev().css('background-color');
    assert.equal($result, 'rgb(235, 235, 49)', 'background color checked');

    $result = $prevMyGrid.find('img').attr('src');
    assert.equal(stringUtil.endsWith($result, '/cadcVOTV/images/transparent-20.png'), true, 'file name checked');

    $result = $prevMyGrid.find('.grid-header-label').text();
    assert.equal(stringUtil.endsWith($result, options.maxRowLimitWarning), true, 'row limit warning text checked');
  });
});
