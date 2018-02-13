'use strict'

var assert = require('assert')
var opencadcJS = require('../')

describe('StringUtil.endsWith', function() {
  var testSubject = new opencadcJS.StringUtil()

  it('Should end with', function() {
    assert.equal(
      testSubject.endsWith('MYTeststr', 'str'),
      true,
      'Wrong answer.'
    )
  })
})

describe('StringUtil.sanitize', function() {
  var testSubject = new opencadcJS.StringUtil()

  it('Should sanitize the string and encode characters', function() {
    var output = testSubject.sanitize('MY&&<>VAL')
    assert.equal('MY&amp;&amp;&lt;&gt;VAL', output)
  })
})

describe('StringUtil.hasText.', function() {
  var testSubject = new opencadcJS.StringUtil()

  it('Should return true.', function() {
    assert.ok(testSubject.hasText('MY&&<>VAL'))
    assert.ok(testSubject.hasText(-14.567))
    assert.ok(testSubject.hasText(0))
  })

  it('Should return false.', function() {
    assert.ok(testSubject.hasText('') === false)
    assert.ok(testSubject.hasText('  ') === false)
    assert.ok(testSubject.hasText(null) === false)
  })
})

describe('StringUtil.format', function() {
  var testSubject = new opencadcJS.StringUtil()

  it('Formatted output should match.', function() {
    assert.equal(
      testSubject.format('Val {1} is {2} but not {3}', ['ONE', 'TWO']),
      'Val ONE is TWO but not {3}'
    )
  })

  it('Formatted number inserts should match.', function() {
    assert.equal(
      testSubject.format('Zero {1} and one {2}', [0, 1]),
      'Zero 0 and one 1'
    )
  })
})

describe('StringUtil.matches', function() {
  var testSubject = new opencadcJS.StringUtil()
  var testString = 'ALL YOUr base Are BEELong to me!'

  it('Should match.', function() {
    assert.ok(testSubject.matches(/long/gi, testString))
    assert.ok(testSubject.matches(/me!/gi, testString))
  })

  it('Should not match.', function() {
    assert.ok(testSubject.matches(/belong/gi, testString) === false)
  })
})

describe('StringUtil.contains', function() {
  var testSubject = new opencadcJS.StringUtil()
  var testString = 'ALL YOUr base Are BEELong to me!'

  it('Should contain.', function() {
    assert.ok(testSubject.contains(testString, 'BEEL', false))
    assert.ok(testSubject.contains(testString, '!'))
    assert.ok(testSubject.contains(testString, 'BAse'))
  })

  it('Should not contain.', function() {
    assert.ok(testSubject.contains(testString, 'belong') === false)
    assert.ok(testSubject.contains(testString, 'are', true) === false)
  })
})

//
// NUMBER FORMAT TESTS
//

describe('NumberFormat fix/prec', function() {
  var testSubject = new opencadcJS.NumberFormat()

  it('NumberFormat.formatFixation', function() {
    assert.equal('88.0000', testSubject.formatFixation(88.0, 4))
  })

  it('NumberFormat.formatPrecision', function() {
    assert.equal('88.00', testSubject.formatPrecision(88.0, 4))
  })
})

describe('NumberFormat format 1', function() {
  var testSubject = new opencadcJS.NumberFormat()

  it('NumberFormat.formatExponentOrFloat', function() {
    assert.equal('0.5484', testSubject.formatExponentOrFloat(0.54842, 4))
  })
})

describe('NumberFormat format 2', function() {
  var testSubject = new opencadcJS.NumberFormat()

  it('NumberFormat.formatExponentOrFloat', function() {
    assert.equal(
      '5.4843e+11',
      testSubject.formatExponentOrFloat(548428932789.25684, 4)
    )
  })
})

describe('NumberFormat format 3', function() {
  var testSubject = new opencadcJS.NumberFormat()

  it('NumberFormat.formatExponentOrFloat', function() {
    assert.equal(
      '548428932789.256835937500',
      testSubject.formatExponentOrFloat(548428932789.25684, 12)
    )
  })
})

//
// ARRAYUTIL TESTS
//

describe('Array Util subtractions', function() {
  var testSubject = new opencadcJS.ArrayUtil()

  it('Array subtract', function() {
    assert.deepEqual([], testSubject.subtract([], []))

    try {
      testSubject.subtract([], null)
    } catch (e) {
      assert.equal(
        'Subtract requires an array or a filter function.',
        e.message
      )
    }

    try {
      testSubject.subtract([])
    } catch (e) {
      assert.equal(
        'Subtract requires an array or a filter function.',
        e.message
      )
    }
  })
})

// Array value subtractions
describe('Array value subtractions', function() {
  var testSubject = new opencadcJS.ArrayUtil()

  it('Should only be missing [3, 4]', function() {
    assert.deepEqual(
      [1, 2, 5, 6, 7],
      testSubject.subtract([1, 2, 3, 4, 5, 6, 7], [3, 4])
    )
  })
})

describe('Array value subtractions 2', function() {
  var testSubject = new opencadcJS.ArrayUtil()

  it('Should be full array returned', function() {
    assert.deepEqual(
      [1, 2, 66, 33, null, 't', 4, 5],
      testSubject.subtract([1, 2, 66, 33, null, 't', 4, 5], [3])
    )
  })
})

describe('Array object subtractions', function() {
  var testSubject = new opencadcJS.ArrayUtil()
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
  ]

  it('Should only have 4, 88', function() {
    var result = testSubject.subtract(testSource, function(element) {
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
      ]

      for (var ci = 0; ci < check.length; ci++) {
        if (check[ci].id === element.id) {
          return false
        }
      }

      return true
    })
    assert.deepEqual(
      [
        {
          id: 4,
          name: 'four'
        },
        {
          id: 88,
          name: 'eighty-eight'
        }
      ],
      result
    )
  })
})

describe('Array sort', function() {
  var testSubject = new opencadcJS.ArrayUtil()

  it('Sort values', function() {
    assert.deepEqual(
      ['98', 'alpha', 'four', 'one', 'zed'],
      testSubject.sort(['one', 'four', 'alpha', 'zed', '98'], null)
    )
  })

  it('Sort on bad value', function() {
    try {
      testSubject.sort(['one', 'four', 'alpha', 'zed', '98'], 'BOGUS')
    } catch (e) {
      assert.equal(
        "Property 'BOGUS' does not exist in the objects being compared.",
        e.message
      )
    }
  })
})

describe('Array sort objects', function() {
  var testSubject = new opencadcJS.ArrayUtil()
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
  ]

  it('Sorted array with objects', function() {
    assert.deepEqual(
      [
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
      ],
      testSubject.sort(testSource, 'name')
    )
  })
})

describe('BooleanUtil true values.', function() {
  var testSubject = new opencadcJS.BooleanUtil()

  it('Check base primitive.', function() {
    assert.ok(testSubject.isTrueValue(true))
    assert.equal(testSubject.isTrueValue(1), true, 'Check value of 1.')
  })

  it('Check for y', function() {
    assert.ok(testSubject.isTrueValue('y'), 'Check for y')
  })

  it('Check for Y', function() {
    assert.ok(testSubject.isTrueValue('Y'), 'Check for Y')
  })

  it('Check for yes', function() {
    assert.ok(testSubject.isTrueValue('Yes'), 'Check for Yes')
    assert.ok(testSubject.isTrueValue('yEs'), 'Check for yEs')
  })

  it('Check string true', function() {
    assert.ok(testSubject.isTrueValue('true'))
  })

  it('Check string false', function() {
    assert.equal(testSubject.isTrueValue('false'), false, 'Should not be true.')
  })

  it('Check string no', function() {
    assert.ok(testSubject.isTrueValue('no') === false)
  })

  it('Check string n', function() {
    assert.ok(testSubject.isTrueValue('n') === false)
  })
})

describe('BooleanUtil false values.', function() {
  var testSubject = new opencadcJS.BooleanUtil()

  it('Check for empty string', function() {
    assert.ok(testSubject.isTrueValue('') === false)
    assert.equal(testSubject.isFalseValue(''), false, 'Should be false.')
  })

  it('Check for undefined', function() {
    assert.equal(
      testSubject.isTrueValue(undefined),
      false,
      'Undefined is not true.'
    )
    assert.equal(
      testSubject.isFalseValue(undefined),
      false,
      'Undefined is not false.'
    )
  })

  it('Check for null', function() {
    assert.equal(testSubject.isTrueValue(null), false, 'Null is not true.')
    assert.equal(testSubject.isFalseValue(null), false, 'Null is not false.')
  })

  it('Check base primitive.', function() {
    assert.ok(testSubject.isFalseValue(false))
    assert.equal(testSubject.isFalseValue(0), true, 'Check value of 0.')
  })

  it('Check for n', function() {
    assert.ok(testSubject.isFalseValue('n'), 'Check for n')
  })

  it('Check for Y', function() {
    assert.ok(testSubject.isFalseValue('N'), 'Check for N')
  })

  it('Check for no', function() {
    assert.ok(testSubject.isFalseValue('No'), 'Check for No')
    assert.ok(testSubject.isFalseValue('nO'), 'Check for nO')
  })

  it('Check string false', function() {
    assert.ok(testSubject.isFalseValue('false'))
  })

  it('Check string true', function() {
    assert.ok(testSubject.isFalseValue('true') === false)
  })

  it('Check string yes', function() {
    assert.ok(testSubject.isFalseValue('yes') === false)
  })

  it('Check string y', function() {
    assert.ok(testSubject.isFalseValue('y') === false)
  })
})

describe('GUID generation.', function() {
  var testSubject = new opencadcJS.GUID()

  it('Generate new GUID.', function() {
    assert.equal(testSubject.generate().length, 36, 'Wrong string length')
  })
})
