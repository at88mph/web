# OpenCADC Virtual Observatory Table Viewer

Version 2.4
January 2017

The cadc-votv project is a utility for viewing large tables in the VOTABLE format within a 
Web browser. It is optimized for handling tables ranging in size from 1000 
to 500,000 rows.  It performs extremely well due to the available JavaScript
objects and structures available to modern browsers.

## Usage

Include all of the JavaScript files necessary in your page.  Unfortunately, order is important for now.

```
<script type="application/javascript" src="js/jquery-2.2.4.min.js"></script>
<script type="application/javascript" src="js/bootstrap.js"></script>
<script type="application/javascript" src="js/cadc.votable.js"></script>
<script type="application/javascript" src="js/cadc.votable-reader.js"></script>
```

### NPM install

