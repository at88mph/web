"use strict";

var assert = require("assert");
var opencadcFilterEngine = require("../opencadc.votable-filter-engine");

describe("Are numbers.", function ()
{
  var filter = new opencadcFilterEngine.FilterEngine();

  function testAreNumbers(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreNumbers(filter.areNumbers("1"), true, "Should be numbers.");
  testAreNumbers(filter.areNumbers("-4"), true, "Should be numbers.");
  testAreNumbers(filter.areNumbers("-2.3"), true, "Should be numbers.");
  testAreNumbers(filter.areNumbers("1", "3", "733.0"), true, "Should be numbers.");
  testAreNumbers(filter.areNumbers("z"), false, "Should not be numbers.");
  testAreNumbers(filter.areNumbers("1", "a", "3"), false, "Should not be numbers.");
});

describe("Are strings.", function ()
{
  var filter = new opencadcFilterEngine.FilterEngine();

  function testAreStrings(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreStrings(filter.areStrings("a"), true, "Should be strings.");
  testAreStrings(filter.areStrings("a"), true, "Should be strings.");
  testAreStrings(filter.areStrings("a", String("b")), true, "Should be strings.");
  testAreStrings(filter.areStrings(String("a")), true, "Should be strings.");
  testAreStrings(filter.areStrings(1), false, "Should not be strings.");
  testAreStrings(filter.areStrings("a", 1), false, "Should not be strings.");
});

describe("Numeric filter.", function ()
{
  var filter = new opencadcFilterEngine.FilterEngine();

  it("30000 times", function ()
  {
    var start = new Date();
    var mockUserFilterValue = "< 3";
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

    console.log("Took " + (end.getTime() - start.getTime()) / 1000
                + " seconds.");
  });
});

describe("String substring filter.", function ()
{
  var filter = new opencadcFilterEngine.FilterEngine();
  var testVal = "N";

  function testAreSubtrings(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testAreSubtrings(filter.valueFilters(testVal, "null"), false, "Should not filter");
  testAreSubtrings(filter.valueFilters(testVal, "Neverland"), false, "Should not filter");
  testAreSubtrings(filter.valueFilters(testVal, "pull"), true, "Should filter");
  testAreSubtrings(filter.valueFilters(testVal, -45), true, "Should filter");
  testAreSubtrings(filter.valueFilters(testVal, 9), true, "Should filter");
  testAreSubtrings(filter.valueFilters(testVal, "Pension"), false, "Should not filter");
  testAreSubtrings(filter.valueFilters(testVal, "abseNce"), false, "Should not filter");
});

describe("String exact match filter.", function ()
{
  var filter = new opencadcFilterEngine.FilterEngine();
  var testVal = "pull";

  function testExactStringFilter(result, expected, name)
  {
    it(name, function ()
    {
      assert.equal(result, expected);
    })
  }

  testExactStringFilter(filter.valueFilters(testVal, "null"), true, "Should filter");
  testExactStringFilter(filter.valueFilters(testVal, "Neverland"), true, "Should filter");
  testExactStringFilter(filter.valueFilters(testVal, "pull"), false, "Should not filter");
  testExactStringFilter(filter.valueFilters(testVal, -45), true, "Should filter");
  testExactStringFilter(filter.valueFilters(testVal, 9), true, "Should filter");
  testExactStringFilter(filter.valueFilters(testVal, "Pension"), true, "Should filter");
  testExactStringFilter(filter.valueFilters(testVal, "abseNce"), true, "Should filter");
});
