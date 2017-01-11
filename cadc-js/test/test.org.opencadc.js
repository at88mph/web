var assert = require('assert');

// Make jQuery available all over.
global.jQuery = require('jquery');

var opencadcJS = require('../js/org.opencadc');
var testSubject = new opencadcJS._test_opencadc_js.StringUtil();

describe('StringUtil.sanitize', function ()
{
  it('Should sanitize the string and encode characters',
     function ()
     {
       var output = testSubject.sanitize("MY&&<>VAL");
       assert.equal("MY&amp;&amp;&lt;&gt;VAL", output);
     });
});
