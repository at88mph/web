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
// var window = {};
// global.window = window;

var xmldom = require('xmldom');
var assert = require('assert');
var opencadcVOViewer = require('../lib/opencadc.votv-viewer');
var opencadcVOFilter = require('../lib/opencadc.votv-filter');

// Create a DOM to pass in.
var xmlDOM = (new xmldom.DOMParser()).parseFromString(xmlData, 'text/xml');

var targetNode = document.createElement('div');
targetNode.setAttribute('id', 'myGrid');

$("head").append('<link rel="stylesheet" type="text/css" href="../css/slick.grid.css" />');

// var styleSheet = document.createElement('link');
// styleSheet.setAttribute('rel', 'stylesheet');
// styleSheet.setAttribute('type', 'text/css');
// styleSheet.setAttribute('href', '../css/slick.grid.css');

document.body.appendChild(targetNode);
// document.head.appendChild(styleSheet);

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

    it('Should match on [Job ID]=[' + columnValue + '].', function ()
    {
      assert.equal(match, true);
    });
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
    it('Should not match on [Job ID]=[' + columnValue + '].', function ()
    {
      assert.equal(match, false);
    });
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
  it('All string filters.', function ()
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

        assert.equal(match, true, 'Should match for [Project]=[' + columnValue +
                                  '].');
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

      assert.equal(match, false, 'Should not match for [Project]=[' +
                                 columnValue + '].');
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
      assert.equal(match, false, 'Should not match for [User]=[' + columnValue +
                                 '].');
    };

    var viewer = new opencadcVOViewer.Viewer('#myGrid', options);

    viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
    {
      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = 'm';
        return colFilters;
      };
      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserMatch(viewer, ' m ');
      doTestUserNotMatch(viewer, 'p');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = 'hello';
        return colFilters;
      };

      doTestUserMatch(viewer, 'hello');
      doTestUserMatch(viewer, 'HEllo');
      doTestUserMatch(viewer, ' hellO ');
      doTestUserNotMatch(viewer, 'hi');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '=m';
        return colFilters;
      };

      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserMatch(viewer, ' m ');
      doTestUserNotMatch(viewer, 'p');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '=hello';
        return colFilters;
      };
      doTestUserMatch(viewer, 'hello');
      doTestUserMatch(viewer, 'HEllo');
      doTestUserMatch(viewer, ' hellO ');
      doTestUserNotMatch(viewer, 'hi');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '= m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserMatch(viewer, ' m ');
      doTestUserNotMatch(viewer, 'p');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '= hello';
        return colFilters;
      };
      doTestUserMatch(viewer, 'hello');
      doTestUserMatch(viewer, 'HEllo');
      doTestUserMatch(viewer, ' hellO ');
      doTestUserNotMatch(viewer, 'hi');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '>m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'n');
      doTestUserMatch(viewer, 'P');
      doTestUserNotMatch(viewer, 'a');
      doTestUserNotMatch(viewer, 'B');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '> m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'n');
      doTestUserMatch(viewer, 'P');
      doTestUserNotMatch(viewer, 'a');
      doTestUserNotMatch(viewer, 'B');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '>=m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'n');
      doTestUserMatch(viewer, 'P');
      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserNotMatch(viewer, 'a');
      doTestUserNotMatch(viewer, 'B');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '>= m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'n');
      doTestUserMatch(viewer, 'P');
      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserNotMatch(viewer, 'a');
      doTestUserNotMatch(viewer, 'B');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '<m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'a');
      doTestUserMatch(viewer, 'B');
      doTestUserNotMatch(viewer, 'n');
      doTestUserNotMatch(viewer, 'P');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '< m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'a');
      doTestUserMatch(viewer, 'B');
      doTestUserNotMatch(viewer, 'n');
      doTestUserNotMatch(viewer, 'P');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '<=m';
        return colFilters;
      };
      doTestUserMatch(viewer, 'a');
      doTestUserMatch(viewer, 'B');
      doTestUserMatch(viewer, 'm');
      doTestUserMatch(viewer, 'M');
      doTestUserNotMatch(viewer, 'n');
      doTestUserNotMatch(viewer, 'P');

      viewer.getColumnFilters = function ()
      {
        var colFilters = {};
        colFilters['User'] = '<= m';
        return colFilters;
      };
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

  function testAreNumbers(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreNumbers(filter.areNumbers('1'), true, 'Should be numbers.');
  testAreNumbers(filter.areNumbers('-4'), true, 'Should be numbers.');
  testAreNumbers(filter.areNumbers('-2.3'), true, 'Should be numbers.');
  testAreNumbers(filter.areNumbers('1', '3', '733.0'), true, 'Should be numbers.');
  testAreNumbers(filter.areNumbers('z'), false, 'Should not be numbers.');
  testAreNumbers(filter.areNumbers('1', 'a', '3'), false, 'Should not be numbers.');
});

describe('Numeric filter.', function ()
{
  var viewer = new opencadcVOViewer.Viewer('#myGrid', options);
  var filter = new opencadcVOFilter.Filter();

  viewer.subscribe(opencadcVOViewer.events.onDataLoaded, function ()
  {
    var match = viewer.searchFilter({'Calibration Level': '>= 2'},
                                    {
                                      grid: viewer.getGrid(),
                                      columnFilters: viewer.getColumnFilters(),
                                      doFilter: filter.valueFilters
                                    });

    assert.equal(match, true, 'Should match for [Calibration Level]=[>= 2].');
    var match2 = viewer.searchFilter({'Calibration Level': '< 0'},
                                     {
                                       grid: viewer.getGrid(),
                                       columnFilters: viewer.getColumnFilters(),
                                       doFilter: filter.valueFilters
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

  function testAreStrings(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreStrings(filter.areStrings('a'), true, 'Should be strings.');
  testAreStrings(filter.areStrings('a'), true, 'Should be strings.');
  testAreStrings(filter.areStrings('a', String('b')), true, 'Should be strings.');
  testAreStrings(filter.areStrings(String('a')), true, 'Should be strings.');
  testAreStrings(filter.areStrings(1), false, 'Should not be strings.');
  testAreStrings(filter.areStrings('a', 1), false, 'Should not be strings.');

});

describe('Numeric filter.', function ()
{
  var filter = new opencadcVOFilter.Filter();

  it('30000 times', function ()
  {
    var start = new Date();
    var mockUserFilterValue = '< 3';
    for (var i = 0; i < 30000; i++)
    {
      var compareValue = Math.floor((Math.random() * 10) + 1);
      var valFilters = filter.valueFilters(mockUserFilterValue, compareValue);

      if (compareValue < 3)
      {
        assert.ok(valFilters === false);
      }
      else
      {
        assert.ok(valFilters === true);
      }
    }

    var end = new Date();

    console.log('Took ' + (end.getTime() - start.getTime()) / 1000
                + ' seconds.');
  });
});

describe('String substring filter.', function ()
{
  var filter = new opencadcVOFilter.Filter();
  var testVal = 'N';

  function testAreSubtrings(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreSubtrings(filter.valueFilters(testVal, 'null'), false, 'Should not filter');
  testAreSubtrings(filter.valueFilters(testVal, 'Neverland'), false, 'Should not filter');
  testAreSubtrings(filter.valueFilters(testVal, 'pull'), true, 'Should filter');
  testAreSubtrings(filter.valueFilters(testVal, -45), true, 'Should filter');
  testAreSubtrings(filter.valueFilters(testVal, 9), true, 'Should filter');
  testAreSubtrings(filter.valueFilters(testVal, 'Pension'), false, 'Should not filter');
  testAreSubtrings(filter.valueFilters(testVal, 'abseNce'), false, 'Should not filter');
});

describe('String exact match filter.', function ()
{
  var filter = new opencadcVOFilter.Filter();
  var testVal = 'pull';

  function testExactStringFilter(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testExactStringFilter(filter.valueFilters(testVal, 'null'), true, 'Should filter');
  testExactStringFilter(filter.valueFilters(testVal, 'Neverland'), true, 'Should filter');
  testExactStringFilter(filter.valueFilters(testVal, 'pull'), false, 'Should not filter');
  testExactStringFilter(filter.valueFilters(testVal, -45), true, 'Should filter');
  testExactStringFilter(filter.valueFilters(testVal, 9), true, 'Should filter');
  testExactStringFilter(filter.valueFilters(testVal, 'Pension'), true, 'Should filter');
  testExactStringFilter(filter.valueFilters(testVal, 'abseNce'), true, 'Should filter');
});
