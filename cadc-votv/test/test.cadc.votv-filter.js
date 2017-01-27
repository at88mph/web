'use strict';

var xmlData =
  '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n'
  +
  '<VOTABLE xmlns=\'http://www.ivoa.net/xml/VOTable/v1.2\' xmlns:xsi=\'http://www.w3.org/2001/XMLSchema-instance\' version=\'1.2\'>\n'
  + '  <RESOURCE type=\'results\'>\n'
  + '    <TABLE>\n'
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
  + '      <FIELD name=\'DEC\' />\n'
  + '      <FIELD name=\'Calibration Level\' datatype=\'int\' />\n'
  + '      <DATA>\n'
  + '        <TABLEDATA>\n'
  + '          <TR>\n'
  + '            <TD>735.0</TD>\n'
  + '            <TD>2011.03.66.8.S</TD>\n'
  + '            <TD>m</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>sleep</TD>\n'
  + '            <TD>Tomcat</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>41.0</TD>\n'
  + '            <TD>1</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>734.0</TD>\n'
  + '            <TD>2011.03.66.9.S</TD>\n'
  + '            <TD>hello</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>sleep</TD>\n'
  + '            <TD>Tomcat</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>47.1</TD>\n'
  + '            <TD>2</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>sleep</TD>\n'
  + '            <TD>Tomcat</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>9.76</TD>\n'
  + '            <TD>3</TD>\n'
  + '          </TR>\n'
  + '          <TR>\n'
  + '            <TD>733.0</TD>\n'
  + '            <TD>2011.03.66.10.N</TD>\n'
  + '            <TD>there</TD>\n'
  + '            <TD />\n'
  + '            <TD>Idle</TD>\n'
  + '            <TD>sleep</TD>\n'
  + '            <TD>Tomcat</TD>\n'
  + '            <TD>1</TD>\n'
  + '            <TD>3072</TD>\n'
  + '            <TD>0</TD>\n'
  + '            <TD>-3.59</TD>\n'
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
var opencadcVOViewer = require('../js/opencadc.votv-viewer');
var opencadcVOFilter = require('../js/opencadc.votv-filter');

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

describe('Filter number columns.', function ()
{
  it ('All number filters.', function ()
  {
    /**
     * The function to test for equality.
     *
     * @param viewer    The test subject.
     * @param columnValue The value of the filter
     */
    var doTestJobIDMatch = function (viewer, columnValue)
    {
      var filter = new opencadcVOFilter.Filter();
      var match = viewer.searchFilter({'Job ID': columnValue},
                                      {
                                        grid: viewer.getGrid(),
                                        columnFilters: viewer.getColumnFilters(),
                                        formatCellValue: function ()
                                        {
                                          return columnValue;
                                        },
                                        doFilter: filter.valueFilters.bind(filter)
                                      });
      assert.equal(match, true, 'Should match on [Job ID]=[' + columnValue
                                + '].');
    };

    /**
     * The function to test for inequality.
     *
     * @param viewer    The test subject.
     * @param columnValue The value of the filter
     */
    var doTestJobIDNotMatch = function (viewer, columnValue)
    {
      var filter = new opencadcVOFilter.Filter();
      var match = viewer.searchFilter({'Job ID': columnValue},
                                      {
                                        grid: viewer.getGrid(),
                                        columnFilters: viewer.getColumnFilters(),
                                        formatCellValue: function ()
                                        {
                                          return columnValue;
                                        },
                                        doFilter: filter.valueFilters.bind(filter)
                                      });
      assert.equal(match, false, 'Should not match on [Job ID]=[' + columnValue
                                 + '].');
    };

    var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

    viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
    {
      viewer.getColumnFilters()['Job ID'] = '735';
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDMatch(viewer, '735');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters()['Job ID'] = '735.0';
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDMatch(viewer, '735');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '=735';
        return colFilters;
      };
      doTestJobIDNotMatch(viewer, '735.0');
      doTestJobIDMatch(viewer, '735');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '=735.0';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '735');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '= 735.0';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '735');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = ' = 735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '736.0');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '>735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '736.0');
      doTestJobIDMatch(viewer, '737.2');
      doTestJobIDMatch(viewer, '740');
      doTestJobIDNotMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '734.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '> 735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '736.0');
      doTestJobIDMatch(viewer, '737.2');
      doTestJobIDMatch(viewer, '740');
      doTestJobIDNotMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '734.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '<735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '732.8');
      doTestJobIDMatch(viewer, '734.0');
      doTestJobIDNotMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '736.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '< 735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '732.8');
      doTestJobIDMatch(viewer, '734.0');
      doTestJobIDMatch(viewer, '730');
      doTestJobIDNotMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '736.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '>=735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '736.0');
      doTestJobIDMatch(viewer, '737.2');
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDMatch(viewer, '740');
      doTestJobIDNotMatch(viewer, '734.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '>= 735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '736.0');
      doTestJobIDMatch(viewer, '737.2');
      doTestJobIDMatch(viewer, '738');
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '734.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '<=735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '732.8');
      doTestJobIDMatch(viewer, '734');
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '736.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '<= 735.0 ';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '732.8');
      doTestJobIDMatch(viewer, '734');
      doTestJobIDMatch(viewer, '735.0');
      doTestJobIDNotMatch(viewer, '736.5');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '732.0..733.5';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '732.0');
      doTestJobIDMatch(viewer, '732.7');
      doTestJobIDMatch(viewer, '733');
      doTestJobIDMatch(viewer, '733.5');
      doTestJobIDNotMatch(viewer, '7');
      doTestJobIDNotMatch(viewer, '731');
      doTestJobIDNotMatch(viewer, '736.5');
      doTestJobIDNotMatch(viewer, '736');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['Job ID'] = '0..1';
        return colFilters;
      };
      doTestJobIDMatch(viewer, '0.0');
      doTestJobIDMatch(viewer, '0');
      doTestJobIDMatch(viewer, '0.3');
      doTestJobIDMatch(viewer, '0.33');
      doTestJobIDMatch(viewer, '1');
      doTestJobIDMatch(viewer, '1.0');
      doTestJobIDNotMatch(viewer, '-1.2');
      doTestJobIDNotMatch(viewer, '-0.1');
      doTestJobIDNotMatch(viewer, '3');
      doTestJobIDNotMatch(viewer, '3.3');
    });

    viewer.build({
                   type: 'xml',
                   data: xmlDOM,
                   defaultNamespace: 'http://www.ivoa.net/xml/VOTable/v1.2'
                 });
  });
});

describe('Performance.', function ()
{
  var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

  viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
  {
    viewer.searchFilter({'Calibration Level': '< 3'},
                        {
                          grid: viewer.getGrid(),
                          columnFilters: viewer.getColumnFilters(),
                          doFilter: viewer.valueFilters
                        });
  });

  viewer.build({
                 data: xmlDOM,
                 defaultNamespace: 'http://www.ivoa.net/xml/VOTable/v1.2'
               });
});

describe('Filter string columns.', function ()
{
  it ('All string filters.', function ()
  {
    /**
     * The function to test for equality.
     *
     * @param viewer    The test subject.
     * @param columnValue The value of the filter
     */
    var doTestUserMatch = function (viewer, columnValue)
    {
      var filter = new opencadcVOFilter.Filter();
      var match = viewer.searchFilter({'User': columnValue},
                                      {
                                        grid: viewer.getGrid(),
                                        columnFilters: viewer.getColumnFilters(),
                                        formatCellValue: function ()
                                        {
                                          return columnValue;
                                        },
                                        doFilter: filter.valueFilters.bind(filter)
                                      });

      assert.equal(match, true,
        'Should match for [User]=[' + columnValue + '].');
    };

    var doTestProjectMatch =
      function (viewer, columnValue)
      {
        var filter = new opencadcVOFilter.Filter();
        var match = viewer.searchFilter({'Project': columnValue},
        {
          grid: viewer.getGrid(),
          columnFilters: viewer.getColumnFilters(),
          formatCellValue: function ()
          {
            return columnValue;
          },
          doFilter: filter.valueFilters.bind(filter)
        });

        assert.equal(match, true, 'Should match for [Project]=[' + columnValue + '].');
      };

      var doTestProjectNotMatch = function (viewer, columnValue)
      {
        var filter = new opencadcVOFilter.Filter();
        var match = viewer.searchFilter({'Project': columnValue},
        {
          grid: viewer.getGrid(),
          columnFilters: viewer.getColumnFilters(),
          formatCellValue: function ()
          {
            return columnValue;
          },
          doFilter: filter.valueFilters.bind(filter)
        });

        assert.equal(match, false, 'Should not match for [Project]=[' + columnValue + '].');
      };

      /**
        * The function to test for inequality.
        *
        * @param viewer    The test subject.
        * @param columnValue The value of the filter
        */
      var doTestUserNotMatch = function (viewer, columnValue)
      {
        var filter = new opencadcVOFilter.Filter();
        var match = viewer.searchFilter({'User': columnValue},
        {
          grid: viewer.getGrid(),
          columnFilters: viewer.getColumnFilters(),
          formatCellValue: function ()
          {
            return columnValue;
          },
          doFilter: filter.valueFilters.bind(filter)
        });
        assert.equal(match, false, 'Should not match for [User]=[' + columnValue + '].');
      };

      var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

      viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
      {
        viewer.getColumnFilters = function () {
          var colFilters = {};
          colFilters['User'] = 'm';
          return colFilters;
        };
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserMatch(viewer, ' m ');
        doTestUserNotMatch(viewer, 'p');

        viewer.getColumnFilters = function () {
          var colFilters = {};
          colFilters['User'] = 'hello';
          return colFilters;
        };

        doTestUserMatch(viewer, 'hello');
        doTestUserMatch(viewer, 'HEllo');
        doTestUserMatch(viewer, ' hellO ');
        doTestUserNotMatch(viewer, 'hi');

        viewer.getColumnFilters = function () {
          var colFilters = {};
          colFilters['User'] = '=m';
          return colFilters;
        };

        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserMatch(viewer, ' m ');
        doTestUserNotMatch(viewer, 'p');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '=hello'; return colFilters; };
        doTestUserMatch(viewer, 'hello');
        doTestUserMatch(viewer, 'HEllo');
        doTestUserMatch(viewer, ' hellO ');
        doTestUserNotMatch(viewer, 'hi');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '= m'; return colFilters; };
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserMatch(viewer, ' m ');
        doTestUserNotMatch(viewer, 'p');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '= hello'; return colFilters; };
        doTestUserMatch(viewer, 'hello');
        doTestUserMatch(viewer, 'HEllo');
        doTestUserMatch(viewer, ' hellO ');
        doTestUserNotMatch(viewer, 'hi');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '>m'; return colFilters; };
        doTestUserMatch(viewer, 'n');
        doTestUserMatch(viewer, 'P');
        doTestUserNotMatch(viewer, 'a');
        doTestUserNotMatch(viewer, 'B');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '> m'; return colFilters; };
        doTestUserMatch(viewer, 'n');
        doTestUserMatch(viewer, 'P');
        doTestUserNotMatch(viewer, 'a');
        doTestUserNotMatch(viewer, 'B');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '>=m'; return colFilters; };
        doTestUserMatch(viewer, 'n');
        doTestUserMatch(viewer, 'P');
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserNotMatch(viewer, 'a');
        doTestUserNotMatch(viewer, 'B');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '>= m'; return colFilters; };
        doTestUserMatch(viewer, 'n');
        doTestUserMatch(viewer, 'P');
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserNotMatch(viewer, 'a');
        doTestUserNotMatch(viewer, 'B');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '<m'; return colFilters; };
        doTestUserMatch(viewer, 'a');
        doTestUserMatch(viewer, 'B');
        doTestUserNotMatch(viewer, 'n');
        doTestUserNotMatch(viewer, 'P');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '< m'; return colFilters; };
        doTestUserMatch(viewer, 'a');
        doTestUserMatch(viewer, 'B');
        doTestUserNotMatch(viewer, 'n');
        doTestUserNotMatch(viewer, 'P');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '<=m'; return colFilters; };
        doTestUserMatch(viewer, 'a');
        doTestUserMatch(viewer, 'B');
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserNotMatch(viewer, 'n');
        doTestUserNotMatch(viewer, 'P');

        viewer.getColumnFilters = function () { var colFilters = {}; colFilters['User'] = '<= m'; return colFilters; };
        doTestUserMatch(viewer, 'a');
        doTestUserMatch(viewer, 'B');
        doTestUserMatch(viewer, 'm');
        doTestUserMatch(viewer, 'M');
        doTestUserNotMatch(viewer, 'n');
        doTestUserNotMatch(viewer, 'P');

        viewer.getColumnFilters = function ()
        {
          var colFilters = {};
          colFilters['User'] = 'a*z';
          return colFilters;
        };
        doTestUserMatch(viewer, 'acz');
        doTestUserMatch(viewer, 'aBz');
        doTestUserMatch(viewer, 'abbbbbCCCCCdddddz');
        doTestUserNotMatch(viewer, 'azb');
        doTestUserNotMatch(viewer, 'ba');

        viewer.getColumnFilters = function ()
        {
          var colFilters = {};
          colFilters['User'] = 'a*z*';
          return colFilters;
        };
        doTestUserMatch(viewer, 'abz');
        doTestUserMatch(viewer, 'aBz');
        doTestUserMatch(viewer, 'abbbbbCCCCCdddddz');
        doTestUserMatch(viewer, 'azb');
        doTestUserNotMatch(viewer, 'ba');

        viewer.getColumnFilters = function ()
        {
          var colFilters = {};
          colFilters['Project'] = '*10*';
          return colFilters;
        };
        doTestProjectNotMatch(viewer, '2011.03.66.8.N');
        doTestProjectMatch(viewer, '2011.03.66.10.N');
        doTestProjectMatch(viewer, '2010.03.66.99.N');

        // Check negated value(s)
        viewer.getColumnFilters = function ()
        {
          var colFilters = {};
          colFilters['Project'] = '!*10*';
          return colFilters;
        };
        doTestProjectMatch(viewer, '2011.03.66.8.N');
        doTestProjectNotMatch(viewer, '2011.03.66.10.N');
        doTestProjectNotMatch(viewer, '2010.03.66.99.N');
      });

    viewer.build({
                   data: xmlDOM,
                   defaultNamespace: 'http://www.ivoa.net/xml/VOTable/v1.2'
                 });
  });
});

describe('Are numbers.', function ()
{
  var filter = new opencadcVOFilter.Filter();

  it ('Filter are numbers', function ()
  {
    assert.equal(filter.areNumbers('1'), true, 'Should be numbers.');
    assert.equal(filter.areNumbers('-4'), true, 'Should be numbers.');
    assert.equal(filter.areNumbers('-2.3'), true, 'Should be numbers.');
    assert.equal(filter.areNumbers('1', '3', '733.0'), true, 'Should be numbers.');
    assert.equal(filter.areNumbers('z'), false, 'Should not be numbers.');
    assert.equal(filter.areNumbers('1', 'a', '3'), false, 'Should not be numbers.');
  });
});

describe('Numeric filter.', function ()
{
  var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

  viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
  {
    var match = viewer.searchFilter({'Calibration Level': '>= 2'},
    {
      grid: viewer.getGrid(),
      columnFilters: viewer.getColumnFilters(),
      doFilter: viewer.valueFilters
    });

    assert.equal(match, true, 'Should match for [Calibration Level]=[>= 2].');
    var match2 = viewer.searchFilter({'Calibration Level': '< 0'},
    {
      grid: viewer.getGrid(),
      columnFilters: viewer.getColumnFilters(),
      doFilter: viewer.valueFilters
    });

    assert.equal(match2, true, 'Should not match for [Calibration Level]=[< 0].');
  });

  viewer.build({
                 data: xmlDOM,
                 defaultNamespace: 'http://www.ivoa.net/xml/VOTable/v1.2'
               });
});

describe('Are strings.', function ()
{
  var filter = new opencadcVOFilter.Filter();

  it ('Filter are strings', function ()
  {
    assert.equal(filter.areStrings('a'), true, 'Should be strings.');
    assert.equal(filter.areStrings('a'), true, 'Should be strings.');
    assert.equal(filter.areStrings('a', String('b')), true, 'Should be strings.');
    assert.equal(filter.areStrings(String('a')), true, 'Should be strings.');
    assert.equal(filter.areStrings(1), false, 'Should not be strings.');
    assert.equal(filter.areStrings('a', 1), false, 'Should not be strings.');
  });
});
