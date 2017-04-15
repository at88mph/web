## OpenCADC URI package (1.0.3)

Provides a small API to use with URIs for access to different
portions of the string.


### currentURI()

Obtain a URI object from the current window location.


### URI

#### getRelativeURI()

Obtain the relative part of the URI.

#### encodeRelativeURI()

Same as getRelativeURI, but with each item separately encoded.  Useful
when this URI will be passed as a parameter, for example.

#### getQueryValue()

Obtain a query parameter value for a given key.

#### getQueryValues()

Obtain an array of values for a given key.

#### removeQueryValues()

Remove query parameters for a given key.

#### clearQuery()

Self explanatory.
