var assert = require('assert');

// Make jQuery available everywhere.
global.jQuery = require('jquery');

var opencadcTest = require('../js/cadc.util');

describe('NumberFormat fix/prec', function ()
{
  var testSubject = new opencadcTest._test_util.NumberFormat(88.0, 4);

  it('NumberFormat.formatFixation', function ()
  {
    assert.equal('88.0000', testSubject.formatFixation());
  });

  it ('NumberFormat.formatPrecision', function ()
  {
    assert.equal('88.00', testSubject.formatPrecision());
  });
});

describe('NumberFormat format 1', function ()
{
  var testSubject = new opencadcTest._test_util.NumberFormat(0.54842, 4);

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('0.5484', testSubject.formatExponentOrFloat());
  });
});

describe('NumberFormat format 2', function ()
{
  var testSubject =
    new opencadcTest._test_util.NumberFormat(548428932789.25684, 4);

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('5.4843e+11', testSubject.formatExponentOrFloat());
  });
});

describe('NumberFormat format 3', function ()
{
  var testSubject =
    new opencadcTest._test_util.NumberFormat(548428932789.25684, 12);

  it('NumberFormat.formatExponentOrFloat', function ()
  {
    assert.equal('548428932789.256835937500',
                 testSubject.formatExponentOrFloat());
  });
});

describe('Array Util subtractions', function ()
{
  it('Empty array util', function()
  {
    try
    {
      new opencadcTest._test_util.Array();
    }
    catch (e)
    {
      assert.equal('Base array is required.', e.message);
    }
  });

  it('Null array', function()
  {
    try
    {
      new opencadcTest._test_util.Array(null);
    }
    catch (e)
    {
      assert.equal('Base array is required.', e.message);
    }
  });

  var testSubject = new opencadcTest._test_util.Array([]);

  it ('Array subtract', function ()
  {
    assert.deepEqual([], testSubject.subtract([]));

    try
    {
      testSubject.subtract(null);
    }
    catch (e)
    {
      assert.equal('Subtract requires an array or a filter function.',
                   e.message);
    }

    try
    {
      testSubject.subtract();
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
  var testSubject = new opencadcTest._test_util.Array([1, 2, 3, 4, 5, 6, 7]);

  it('Should only be missing [3, 4]', function ()
  {
    assert.deepEqual([1, 2, 5, 6, 7], testSubject.subtract([3, 4]));
  });
});

describe('Array value subtractions 2', function ()
{
  var testSubject =
    new opencadcTest._test_util.Array([1, 2, 66, 33, null, 't', 4, 5]);

  it('Should be full array returned', function ()
  {
    assert.deepEqual([1, 2, 66, 33, null, 't', 4, 5],
                     testSubject.subtract([3]));
  });
});

describe('Array object subtractions', function ()
{
  var testSubject = new opencadcTest._test_util.Array([
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
  ]);

  it('Should only have 4, 88', function ()
  {
    var result = testSubject.subtract(function (element)
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
  var testSubject =
    new opencadcTest._test_util.Array(['one', 'four', 'alpha', 'zed', '98']);

  it('Sort values', function ()
  {
    assert.deepEqual(['98', 'alpha', 'four', 'one', 'zed'], testSubject.sort());
  });

  it('Sort on bad value', function ()
  {
    try
    {
      testSubject.sort('BOGUS');
    }
    catch (e)
    {
      assert.equal('Property \'BOGUS\' does not exist in the objects being compared.', e.message);
    }
  });
});

describe('Array sort objects', function ()
{
  var testSubject = new opencadcTest._test_util.Array([
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
  ]);

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
                     ], testSubject.sort('name'));
  });
});
