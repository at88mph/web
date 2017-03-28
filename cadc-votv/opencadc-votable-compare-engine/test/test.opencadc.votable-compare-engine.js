/**
 * Created by Dustin on 2017-03-26.
 */

'use strict';

var assert = require('assert');
var testSubject = require('../lib/opencadc.votable-compare-engine');

describe('Compare values.', function()
{
  var compareEngine = new testSubject.DefaultCompareEngine('key');

  it('String compare.', function()
  {
    // assert.equal(compareEngine.compare(), false, 'Wrong answer.');
    assert.equal(compareEngine.compare({'key': '4'}, {'key': 4}), 0, 'Wrong answer.');
    // assert.equal(compareEngine.compare('f', 'F'), false, 'Wrong answer.');
  });
});
