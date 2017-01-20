var assert = require('assert');

// Make jQuery available everywhere.
global.$ = require('jquery');

var opencadcJS = require('../lib/cadc.uri');

describe('Test URI components from full URL.', function ()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/1/2/item.txt');

  it('URI.getPath', function ()
  {
    assert.equal('/path/1/2/item.txt', testSubject.getPath());
  });
});

describe('Test URI components from full URL 2.', function()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/item.txt?a=b&c=d');

  it ('Path should be /path/item.txt', function ()
  {
    assert.equal('/path/item.txt', testSubject.getPath());
  });

  it ('Query string params', function()
  {
    var q = testSubject.getQuery();
    assert.equal('b', q.a[0]);
    assert.equal('d', q.c[0]);
  });

  it ('Query paths', function ()
  {
    // the path should remain unchanged
    var path = testSubject.getPath();
    testSubject.clearQuery();

    assert.equal('/path/item.txt', path);

    // the relative path should be cleaned up
    assert.equal(testSubject.getRelativeURI(), path);

    var q = testSubject.getQuery();

    assert.ok(q.hasOwnProperty('a') === false);
  });
});

describe('Test empty query.', function()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/');

  it('Query object should be empty', function ()
  {
    var q = testSubject.getQuery();

    assert.equal('{}', JSON.stringify(q), 'Query object should be empty.');
  });
});

describe('Test URI components from URI.', function()
{
  var testSubject = new opencadcJS.URI('caom2:path/a/b/item.fits');

  it ('getPath calculation', function ()
  {
    assert.equal('path/a/b/item.fits', testSubject.getPath());
  });
});

describe('Test parse out full relative URI.', function()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/item.txt?a=b&c=d');

  it ('Relative URI', function ()
  {
    assert.equal('/path/item.txt?a=b&c=d', testSubject.getRelativeURI());
  });
});

describe('Test parse out path only relative URI.', function()
{
  var testSubject =
      new opencadcJS.URI('http://www.mysite.com/path/item.txt');

  assert.equal(testSubject.getRelativeURI(), '/path/item.txt',
        'Relative URI should be: /path/item.txt');

  // Test for encoded query parameters.
  testSubject = new opencadcJS.URI(
      'http://www.mysite.com/my/path?A=B%20C.D%20AS%20%22E%22');

  assert.equal(testSubject.getRelativeURI(), '/my/path?A=B%20C.D%20AS%20%22E%22',
        'Relative URI should be: /my/path?A=B%20C.D%20AS%20%22E%22');
});

describe('Handle multiple values for single key.', function()
{
  var testSubject =
      new opencadcJS.URI('http://www.mysite.com/path/item.txt?A=Eh&A=S');

  it('Query values', function ()
  {
    assert.deepEqual(['Eh', 'S'], testSubject.getQueryValues('A'));
  });
});

describe('Encoded relative URI.', function()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/item.txt?A=Eh&A=S#/go/here');

  it ('encodeRelativeURI', function()
  {
    assert.equal('/path/item.txt?A=Eh&A=S%23%2Fgo%2Fhere',
                 testSubject.encodeRelativeURI());
  });
});


describe('Set query parameters.', function()
{
  var testSubject = new opencadcJS.URI(
    'http://www.mysite.com/path/item.txt?param1=val1&param2=val2&param2=val3&param3=val4');

  it('setQueryValue', function ()
  {
    testSubject.setQueryValue('param1', 'valX');

    assert.equal('valX', testSubject.getQueryValue('param1'));

    try
    {
      testSubject.setQueryValue('param2', 'valY');
    }
    catch (e)
    {
      assert.equal('There are multiple parameters with the name \'param2\'.',
                   e.message);
    }
  });
});


describe('Remove query parameters.', function()
{
  var testSubject = new opencadcJS.URI(
        'http://www.mysite.com/path/item.txt?param1=val1&param2=val2&param2=val3&param3=val4');

  it('removeQueryValues', function ()
  {
    testSubject.removeQueryValues('param1');

    assert.equal(null, testSubject.getQueryValue('param1'));

    testSubject.removeQueryValues('param2');

    assert.equal(null, testSubject.getQueryValue('param2'));

    // Should still have param3.
    assert.equal('val4', testSubject.getQueryValue('param3'));
  });
});

describe('Convert back to string.', function()
{
  var testSubject =
      new opencadcJS.URI(
        'http://www.mysite.com/path/item.txt?param1=val1&param2=val2&param2=val3&param3=val4#hash=42');

  it('toString 1', function ()
  {
    assert.equal('http://www.mysite.com/path/item.txt?param1=val1&param2=val2&param2=val3&param3=val4#hash=42',
                 testSubject.toString());
  });

  it ('URI String after remove', function ()
  {
    testSubject.removeQueryValues('param1');

    assert.equal(null, testSubject.getQueryValue('param1'));
    assert.equal('http://www.mysite.com/path/item.txt?param2=val2&param2=val3&param3=val4#hash=42',
                 testSubject.toString());
  });
});

describe('Back to string again', function ()
{
  var testSubject =
    new opencadcJS.URI('http://www.mysite.com:4080/aq/');

  it('Bare toString', function ()
  {
    assert.equal('http://www.mysite.com:4080/aq/', testSubject.toString());
  });
});

describe('Back to string 2', function ()
{
  var testSubject = new opencadcJS.URI(
    '?param1=val1&param2=val2&param2=val3&param3=val4');

  it('Bare query param toString', function ()
  {
    assert.equal('?param1=val1&param2=val2&param2=val3&param3=val4',
                 testSubject.toString());
  });
});

describe('Back to string with params', function ()
{
  var testSubject =
    new opencadcJS.URI('http://www.mysite.com/path/item.txt?param1=val1&param2=val%26%202&param2=val3&param3=val%26#hash=42');

  it('Bare query param toString', function ()
  {
    assert.equal('http://www.mysite.com/path/item.txt?param1=val1&param2=val%26%202&param2=val3&param3=val%26#hash=42',
                 testSubject.toString());
  });
});

describe('Test toString with encoded query string', function()
{
  var testSubject =
    new opencadcJS.URI('http://www.mysite.com/path/item.txt?param1=val1&param2=val3#hash=42');

  it('With hash', function ()
  {
    testSubject.setQueryValue('param2', 'val& 2');
    testSubject.setQueryValue('param3', 'val&');

    assert.equal('http://www.mysite.com/path/item.txt?param1=val1&param2=val%26%202&param3=val%26#hash=42',
                 testSubject.toEncodedString());
  });
});
