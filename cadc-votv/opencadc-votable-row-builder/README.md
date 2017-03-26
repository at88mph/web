# OpenCADC Virtual Observatory Table Row Builder

Version 1.0.1
March 2017

Row Builder class to stream data and fire events per row to notify a client subscribed to the appropriate events.

## Installation

```
npm install opencadc-votable-row-builder
```

## Usage

```
require('opencadc-votable-row-builder');

var rowBuilderFactory = new RowBuilderFactory.createBuilder('csv'|'xml');
rowBuilderFactory.subscribe(...);

```

