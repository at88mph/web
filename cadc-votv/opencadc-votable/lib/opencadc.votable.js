'use strict';

var opencadcJSUtil = require('opencadc-js').util;

(function (opencadcJSUtil)
{
  /**
   * VOTable Metadata class.
   *
   * @param _infos
   * @param _description
   * @param _fields
   * @constructor
   */
  function Metadata(_infos, _description, _fields)
  {
    var infos = _infos || [];
    var description = _description;
    var fields = _fields || [];

    this.getInfos = function ()
    {
      return infos;
    };

    this.getDescription = function ()
    {
      return description;
    };

    this.getFields = function ()
    {
      return fields;
    };

    /**
     * Set this metadata's fields.
     *
     * @param _fields  {Array} of values.
     */
    this.setFields = function (_fields)
    {
      fields = _fields;
    };

    this.addField = function (_field)
    {
      fields.push(_field);
    };

    this.insertField = function (_fieldIndex, field)
    {
      fields[_fieldIndex] = field;
    };

    this.hasFieldWithID = function (_fieldID)
    {
      return (this.getField(_fieldID) !== null);
    };

    /**
     * Obtain a Field by its ID.
     * @param _fieldID    The field ID to obtain a field for.
     *
     * @return {cadc.vot.Field}   Field instance, or null if not found.
     */
    this.getField = function (_fieldID)
    {
      if (_fieldID)
      {
        for (var f = 0; f < fields.length; f++)
        {
          var nextField = fields[f];

          if (nextField && (fields[f].getID() === _fieldID))
          {
            return nextField;
          }
        }
      }

      return null;
    };
  }

  function DataTypeFactory()
  {
    /**
     * Our Factory method for creating new DataType instances.
     *
     * @param input
     * @returns {CSVRowBuilder|*|VOTableXMLRowBuilder}
     */
    DataTypeFactory.prototype.createDataType = function (input)
    {
      switch (input.type)
      {
        case 'xml':
        {
          this.builderClass = VOTableXMLRowBuilder;
          break;
        }

        case 'csv':
        {
          this.builderClass = CSVRowBuilder;
          break;
        }

        // Defaults to RowBuilderFactory.prototype.builderClass (VOTableXMLBuilder)
        default:
        {
          this.builderClass = VOTableXMLRowBuilder;
          break;
        }
      }

      return new this.builderClass(input);
    };

    module.exports.DataTypeFactory = DataTypeFactory;
  }

  function DataType(_datatypeValue)
  {
    var datatypeValue = _datatypeValue || 'varchar';
    var stringTypes = ['varchar', 'char', 'adql:VARCHAR', 'adql:CLOB', 'adql:REGION'];
    var integerTypes = ['int', 'long', 'short'];
    var floatingPointTypes = ['float', 'double', 'adql:DOUBLE', 'adql:FLOAT'];
    var timestampTypes = ['timestamp', 'adql:TIMESTAMP'];


    this.isNumeric = function ()
    {
      // will accept float, double, long, int, short, real, adql:DOUBLE,
      // adql:INTEGER, adql:POINT, adql:REAL
      //
      return !this.isCharDatatype() && !this.isTimestamp() && !this.isBoolean();
    };

    /**
     * Return whether this datatype is a Timestamp.
     * @returns {boolean}   True if timestamp, False otherwise.
     */
    this.isTimestamp = function ()
    {
      return datatypeMatches(timestampTypes);
    };

    this.isBoolean = function ()
    {
      return datatypeValue === 'boolean';
    };

    this.isFloatingPointNumeric = function ()
    {
      return datatypeMatches(floatingPointTypes);
    };

    this.isIntegerNumeric = function ()
    {
      return datatypeMatches(integerTypes);
    };

    this.isCharDatatype = function ()
    {
      return datatypeMatches(stringTypes);
    };

    function datatypeMatches(_datatypes)
    {
      var stringUtil = new opencadcJSUtil.StringUtil();
      for (var stIndex = 0; stIndex < _datatypes.length; stIndex++)
      {
        if (stringUtil.contains(datatypeValue, _datatypes[stIndex]))
        {
          return true;
        }
      }
      return false;
    }
  }

  // 'Sub-classes' of RowBuilder
  opencadcJSUtil.inheritPrototype(NumberDataType, DataType);

  /**
   *
   * @param _name
   * @param _id
   * @param _ucd
   * @param _utype
   * @param _unit
   * @param _xtype
   * @param _datatype    Datatype object.
   * @param _arraysize
   * @param _description
   * @param _label
   * @constructor
   */
  function Field(_name, _id, _ucd, _utype, _unit, _xtype,
                 _datatype, _arraysize, _description, _label)
  {
    var INTERVAL_XTYPE_KEYWORD = 'INTERVAL';

    var name = _name;
    var id = _id;
    var ucd = _ucd;
    var utype = _utype;
    var unit = _unit;
    var xtype = _xtype;
    var datatype = _datatype || new DataType();
    var arraysize = _arraysize;
    var description = _description;
    var label = _label;

    this.getName = function ()
    {
      return name;
    };

    this.getID = function ()
    {
      return id;
    };

    this.getLabel = function ()
    {
      return label;
    };

    this.getUType = function ()
    {
      return utype;
    };

    this.getUCD = function ()
    {
      return ucd;
    };

    this.getUnit = function ()
    {
      return unit;
    };

    this.getXType = function ()
    {
      return xtype;
    };

    this.containsInterval = function ()
    {
      var stringUtil = new opencadcJSUtil.StringUtil();
      return stringUtil.contains(_xtype, INTERVAL_XTYPE_KEYWORD);
    };

    this.getDatatype = function ()
    {
      return datatype;
    };

    this.getDescription = function ()
    {
      return description;
    };

    this.getArraySize = function ()
    {
      return arraysize;
    };
  }

  function Info(_name, _value)
  {
    var name = _name;
    var value = _value;

    this.getName = function ()
    {
      return name;
    };

    this.getValue = function ()
    {
      return value;
    };

    this.isError = function ()
    {
      return (name === 'ERROR');
    };
  }

  function Resource(_id, _name, _type)
  {
    var ID = _id;
    var name = _name;
    var type = _type;

    this.getID = function ()
    {
      return ID;
    };

    this.isResults = function ()
    {
      return (type === 'results');
    };

    this.getName = function ()
    {
      return name;
    };
  }

  /**
   *
   * @param _id
   * @param _cells
   * @constructor
   */
  function Row(_id, _cells)
  {
    var id = _id;
    var cells = _cells || [];

    this.getID = function ()
    {
      return id;
    };

    this.getCells = function ()
    {
      return cells;
    };

    this.getSize = function ()
    {
      return _cells.length;
    };

    /**
     * Obtain the value of a cell in this row.
     *
     * @param _fieldID    The ID of the cell's field.
     * @returns {*}     Value of the cell.
     */
    this.getCellValue = function (_fieldID)
    {
      var value = null;

      for (var ci = 0, cl = cells.length; ci < cl; ci++)
      {
        var cell = cells[ci];
        var cellFieldID = cell.getField().getID();

        if (cellFieldID === _fieldID)
        {
          value = cell.getValue();
          break;
        }
      }

      return value;
    };
  }

  /**
   * Cell object within a row.
   *
   * @param _value
   * @param _field
   * @constructor
   */
  function Cell(_value, _field)
  {
    var value = _value;
    var field = _field;

    this.getValue = function ()
    {
      return value;
    };

    this.getField = function ()
    {
      return field;
    };
  }

  /**
   * An encompassing VOTable object.
   *
   * @param _resources      The RESOURCE elements.
   * @param _infos          The INFO elements.
   * @param _description    The optional DESCRIPTION text.
   * @constructor
   */
  function VOTable(_resources, _infos, _description)
  {
    var resources = _resources || [];
    var infos = _infos || [];
    var description = _description;

    /**
     * Return
     * @returns {*}
     */
    this.getDescription = function()
    {
      return description;
    };

    /**
     * Return the array of resources.
     * @returns {*|Array}
     */
    this.getResources = function()
    {
      return resources;
    };

    this.getResultsResources = function()
    {
      var results = [];
      for (var i = 0, rl = resources.length; i < rl; i++)
      {
        var r = resources[i];
        if (r.isResults() === true)
        {
          results.push(r);
        }
      }
      return results;
    };

    this.getInfos = function ()
    {
      return infos;
    };
  }

  module.exports = {
    Resource: Resource,
    Datatype: DataType,
    Row: Row,
    Cell: Cell,
    Info: Info,
    Field: Field,
    Metadata: Metadata,
    VOTable: VOTable
  };
})(opencadcJSUtil);
