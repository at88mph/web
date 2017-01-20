var assert = require('assert');

// Make jQuery available all over.
global.$ = require('jquery');

var opencadcJS = require('../lib/org.opencadc');

describe('StringUtil.sanitize', function ()
{
  var testSubject = new opencadcJS.StringUtil();

  it('Should sanitize the string and encode characters',
     function ()
     {
       var output = testSubject.sanitize('MY&&<>VAL');
       assert.equal('MY&amp;&amp;&lt;&gt;VAL', output);
     }
  );
});

describe('StringUtil.hasText.', function ()
{
  var testSubject = new opencadcJS.StringUtil();

  it('Should return true.', function ()
  {
    assert.ok(testSubject.hasText('MY&&<>VAL'));
    assert.ok(testSubject.hasText(-14.567));
    assert.ok(testSubject.hasText(0));
  });

  it('Should return false.', function ()
  {
    assert.ok(testSubject.hasText('') === false);
  });
});

describe('StringUtil.format', function ()
{
  var testSubject = new opencadcJS.StringUtil();

  it('Formatted output should match.', function ()
  {
    assert.equal(testSubject.format("Val {1} is {2} but not {3}",
                                    ["ONE", "TWO"]),
                 "Val ONE is TWO but not {3}");
  });
});

describe('StringUtil.matches', function ()
{
  var testSubject = new opencadcJS.StringUtil();
  var testString = 'ALL YOUr base Are BEELong to me!';

  it('Should match.', function ()
  {
    assert.ok(testSubject.matches(/long/gi, testString));
    assert.ok(testSubject.matches(/me!/gi, testString));
  });

  it('Should not match.', function ()
  {
    assert.ok(testSubject.matches(/belong/gi, testString) === false);
  });
});

describe('StringUtil.contains', function ()
{
  var testSubject = new opencadcJS.StringUtil();
  var testString = 'ALL YOUr base Are BEELong to me!';

  it('Should contain.', function ()
  {
    assert.ok(testSubject.contains(testString, 'BEEL', false));
    assert.ok(testSubject.contains(testString, '!'));
    assert.ok(testSubject.contains(testString, 'BAse'));
  });

  it('Should not contain.', function ()
  {
    assert.ok(testSubject.contains(testString, 'belong') === false);
    assert.ok(testSubject.contains(testString, 'are', true) === false);
  });
});

//
// NUMBER FORMAT TESTS
//

describe('NumberFormat fix/prec', function ()
{
  var testSubject = new opencadcJS.NumberFormat();

  it('NumberFormat.formatFixation', function ()
  {
    assert.equal('88.0000', testSubject.formatFixation(88.0, 4));
  });

  it('NumberFormat.formatPrecision', function ()
  {
    assert.equal('88.00', testSubject.formatPrecision(88.0, 4));
  });
});

describe('NumberFormat format 1', function ()
{
  var testSubject = new opencadcJS.NumberFormat();

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('0.5484', testSubject.formatExponentOrFloat(0.54842, 4));
  });
});

describe('NumberFormat format 2', function ()
{
  var testSubject = new opencadcJS.NumberFormat();

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('5.4843e+11',
                 testSubject.formatExponentOrFloat(548428932789.25684, 4));
  });
});

describe('NumberFormat format 3', function ()
{
  var testSubject = new opencadcJS.NumberFormat();

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('548428932789.256835937500',
                 testSubject.formatExponentOrFloat(548428932789.25684, 12));
  });
});

//
// ARRAYUTIL TESTS
//

describe('Array Util subtractions', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();

  it('Array subtract', function ()
  {
    assert.deepEqual([], testSubject.subtract([], []));

    try
    {
      testSubject.subtract([], null);
    }
    catch (e)
    {
      assert.equal('Subtract requires an array or a filter function.',
                   e.message);
    }

    try
    {
      testSubject.subtract([]);
    }
    catch (e)
    {
      assert.equal('Subtract requires an array or a filter function.',
                   e.message);
    }
  });
});

// Array value subtractions
describe('Array value subtractions', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();

  it('Should only be missing [3, 4]', function ()
  {
    assert.deepEqual([1, 2, 5, 6, 7],
                     testSubject.subtract([1, 2, 3, 4, 5, 6, 7], [3, 4]));
  });
});

describe('Array value subtractions 2', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();

  it('Should be full array returned', function ()
  {
    assert.deepEqual([1, 2, 66, 33, null, 't', 4, 5],
                     testSubject.subtract([1, 2, 66, 33, null, 't', 4, 5],
                                          [3]));
  });
});

describe('Array object subtractions', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();
  var testSource = [
    {
      id: 4,
      name: 'four'
    },
    {
      id: 5,
      name: 'five'
    },
    {
      id: 88,
      name: 'eighty-eight'
    }
  ];

  it('Should only have 4, 88', function ()
  {
    var result = testSubject.subtract(testSource, function (element)
    {
      var check = [
        {
          id: 1,
          name: 'one'
        },
        {
          id: 5,
          name: 'five'
        },
        {
          id: 100,
          name: 'one-hundred'
        }
      ];

      for (var ci = 0; ci < check.length; ci++)
      {
        if (check[ci].id == element.id)
        {
          return false;
        }
      }

      return true;
    });
    assert.deepEqual([
                       {
                         id: 4,
                         name: 'four'
                       },
                       {
                         id: 88,
                         name: 'eighty-eight'
                       }
                     ], result);
  });
});

describe('Array sort', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();

  it('Sort values', function ()
  {
    assert.deepEqual(['98', 'alpha', 'four', 'one', 'zed'],
                     testSubject.sort(['one', 'four', 'alpha', 'zed', '98'],
                                      null));
  });

  it('Sort on bad value', function ()
  {
    try
    {
      testSubject.sort(['one', 'four', 'alpha', 'zed', '98'], 'BOGUS');
    }
    catch (e)
    {
      assert.equal('Property \'BOGUS\' does not exist in the objects being compared.',
                   e.message);
    }
  });
});

describe('Array sort objects', function ()
{
  var testSubject = new opencadcJS.ArrayUtil();
  var testSource = [
    {
      id: 4,
      name: 'four'
    },
    {
      id: 5,
      name: 'five'
    },
    {
      id: 88,
      name: 'eighty-eight'
    }
  ];

  it('Sorted array with objects', function ()
  {
    assert.deepEqual([
                       {
                         id: 88,
                         name: 'eighty-eight'
                       },
                       {
                         id: 5,
                         name: 'five'
                       },
                       {
                         id: 4,
                         name: 'four'
                       }
                     ], testSubject.sort(testSource, 'name'));
  });
});