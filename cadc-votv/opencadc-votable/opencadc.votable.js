'use strict';

(function(opencadcUtil, undefined) {
    /**
   * VOTable Metadata class.
   *
   * @param {[]} [_infos=[]]          An array of INFO elements.
   * @param {String} [_description=null]   String descriptive text.
   * @param {[]} [_fields=[]]         An array of Field objects.
   * @constructor
   */
    function Metadata(_infos, _description, _fields) {
        var infos = _infos || [];
        var description = _description;
        var fields = _fields || [];

        /**
     * Obtain the INFO elements.
     *
     * @returns {Array}
     */
        this.getInfos = function() {
            return infos;
        };

        /**
     * Obtain this Metadata's description.
     * @return {String}
     */
        this.getDescription = function() {
            return description;
        };

        /**
     * Obtain the fields for this Metadata.
     *
     * @returns {*|Array}
     */
        this.getFields = function() {
            return fields;
        };

        /**
     * Set this metadata's fields.
     *
     * @param _fields  {Array} of values.
     */
        this.setFields = function(_fields) {
            fields = _fields;
        };

        /**
     * Add a new field to this metadata.
     *
     * @param {Field} _field    The new field.
     */
        this.addField = function(_field) {
            fields.push(_field);
        };

        /**
     * Insert a new field at the specified index.
     *
     * @param {Number}  _fieldIndex   The index to place it at.
     * @param {Field} _field          The new field.
     */
        this.insertField = function(_fieldIndex, _field) {
            fields[_fieldIndex] = _field;
        };

        /**
     * Obtain whether a field with the given ID exists.
     *
     * @param _fieldID      The ID to check.
     * @returns {boolean}   True it is here, False otherwise.
     */
        this.hasFieldWithID = function(_fieldID) {
            return this.getField(_fieldID) !== null;
        };

        /**
     * Obtain a Field by its ID.
     * @param _fieldID    The field ID to obtain a field for.
     *
     * @return {Field}   Field instance, or null if not found.
     */
        this.getField = function(_fieldID) {
            if (_fieldID) {
                for (var f = 0; f < fields.length; f++) {
                    var nextField = fields[f];

                    if (nextField && fields[f].getID() === _fieldID) {
                        return nextField;
                    }
                }
            }

            return null;
        };
    }

    /**
   * Represents a String DataType, but is forgiving for comparing, say, a number to a String.
   * @constructor
   */
    function StringDataType() {
        /**
     * Compare the two values, and return 1 for
     *
     * @param _this           Left object containing a valued assigned to the sortKey.
     * @param _toThis         Right object containing a valued assigned to the sortKey.
     * @returns {number}      1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
        this.compare = function(_this, _toThis) {
            // Already equivalent?  Great, proceed.
            if (_this === _toThis) {
                return 0;
            } else {
                var left = this.sanitize(_this).trim();
                var right = this.sanitize(_toThis).trim();

                return left === right ? 0 : left > right ? 1 : -1;
            }
        };

        /**
     * Return the formatted value.
     *
     * @param _val          The value to format.
     * @returns {string}
     */
        this.sanitize = function(_val) {
            return _val ? _val + '' : '';
        };

        /**
     * Obtain the help text to be shown to users.
     * @returns {string}
     */
        this.tooltipText = function() {
            return 'String: Substring match , ! to negate matches';
        };
    }

    function IntegerDataType() {
        /**
     * Compare the two values.
     *
     * @param _this           Left object containing a valued assigned to the sortKey.
     * @param _toThis         Right object containing a valued assigned to the sortKey.
     * @returns {number}      1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
        this.compare = function(_this, _toThis) {
            // Already equivalent?  Great, proceed.
            if (_this === _toThis) {
                return 0;
            } else {
                var left = this.sanitize(_this);
                var right = this.sanitize(_toThis);

                return left === right ? 0 : left > right ? 1 : -1;
            }
        };

        /**
     * Return the formatted value.
     *
     * @param _val          The value to format.
     * @returns {Number}
     */
        this.sanitize = function(_val) {
            return _val ? parseInt(_val) : Number.NaN;
        };

        /**
     * Obtain the help text to be shown to users.
     * @returns {string}
     */
        this.tooltipText = function() {
            return 'Number: 10 or >=10 or 10..20 for a range , ! to negate';
        };
    }

    function FloatingPointDataType() {
        /**
     * Compare the two values.
     *
     * @param _this           Left object containing a valued assigned to the sortKey.
     * @param _toThis         Right object containing a valued assigned to the sortKey.
     * @returns {number}      1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
        this.compare = function(_this, _toThis) {
            // Already equivalent?  Great, proceed.
            if (_this === _toThis) {
                return 0;
            } else {
                var left = this.sanitize(_this);
                var right = this.sanitize(_toThis);

                return left === right ? 0 : left > right ? 1 : -1;
            }
        };

        /**
     * Return the formatted value.
     *
     * @param _val          The value to format.
     * @returns {Number}
     */
        this.sanitize = function(_val) {
            return _val ? parseFloat(_val) : Number.NaN;
        };

        /**
     * Obtain the help text to be shown to users.
     * @returns {string}
     */
        this.tooltipText = function() {
            return 'Number: 10 or >=10 or 10..20 for a range , ! to negate';
        };
    }

    function BooleanDataType() {
        var trueMatcher = /^\s*true\s*$/i;

        /**
     * Compare the two values, and return 1 for
     *
     * @param _this           Left object containing a valued assigned to the sortKey.
     * @param _toThis         Right object containing a valued assigned to the sortKey.
     * @returns {number}      1 means compareThis is greater than toThis, 0 means equality, and -1 means compareThis
     * is less than toThis.
     */
        this.compare = function(_this, _toThis) {
            // Already equivalent?  Great, proceed.
            if (_this === _toThis) {
                return 0;
            } else {
                var left = this.sanitize(_this);
                var right = this.sanitize(_toThis);

                return left === right ? 0 : left > right ? 1 : -1;
            }
        };

        /**
     * Return the formatted value.
     *
     * @param _val          The value to format.
     * @returns {boolean}
     */
        this.sanitize = function(_val) {
            return _val ? trueMatcher.test(_val) : false;
        };

        /**
     * Obtain the help text to be shown to users.
     * @returns {string}
     */
        this.tooltipText = function() {
            return 'String: Substring match , ! to negate matches';
        };
    }

    /**
   * Factory to create a DataType object from a provided type.
   * @constructor
   */
    function DataTypeFactory() {
        var intTest = /^\s*(adql:)?int(eger)?|long|short\s*$/i;
        var booleanTest = /^\s*(adql:)?bool(ean)?\s*$/i;
        var floatTest = /^\s*(adql:)?float|double\s*$/i;

        function isBoolean(_dataTypeValue) {
            return booleanTest.test(_dataTypeValue);
        }

        function isFloatingPointNumeric(_dataTypeValue) {
            return floatTest.test(_dataTypeValue);
        }

        function isIntegerNumeric(_dataTypeValue) {
            return intTest.test(_dataTypeValue);
        }

        /**
     * Our Factory method for creating new DataType instances.
     *
     * @param _dataTypeValue
     * @returns {FloatingPointDataType|BooleanDataType|IntegerDataType|StringDataType}
     */
        this.createDataType = function(_dataTypeValue) {
            if (isFloatingPointNumeric(_dataTypeValue)) {
                this.dataTypeClass = FloatingPointDataType;
            } else if (isBoolean(_dataTypeValue)) {
                this.dataTypeClass = BooleanDataType;
            } else if (isIntegerNumeric(_dataTypeValue)) {
                this.dataTypeClass = IntegerDataType;
            } else {
                this.dataTypeClass = StringDataType;
            }

            return new this.dataTypeClass();
        };
    }

    /**
   *
   * @param {String} _name
   * @param {String} [_id]
   * @param {String} [_ucd]
   * @param {String} [_utype]
   * @param {String} [_unit]
   * @param {String} [_xtype]
   * @param {FloatingPointDataType|BooleanDataType|IntegerDataType|StringDataType} [_dataType=StringDataType]
   * DataType instance.
   * @param {String|Number} [_arraysize]
   * @param {String}[_description]
   * @param {String} [_label]
   * @constructor
   */
    function Field(
        _name,
        _id,
        _ucd,
        _utype,
        _unit,
        _xtype,
        _dataType,
        _arraysize,
        _description,
        _label
    ) {
        var INTERVAL_XTYPE_KEYWORD = 'INTERVAL';

        var name = _name;
        var id = _id;
        var ucd = _ucd;
        var utype = _utype;
        var unit = _unit;
        var xtype = _xtype;
        var dataType = _dataType || new StringDataType();
        var arraysize = _arraysize;
        var description = _description;
        var label = _label;

        this.getName = function() {
            return name;
        };

        this.getID = function() {
            return id;
        };

        this.getLabel = function() {
            return label;
        };

        this.getUType = function() {
            return utype;
        };

        this.getUCD = function() {
            return ucd;
        };

        this.getUnit = function() {
            return unit;
        };

        this.getXType = function() {
            return xtype;
        };

        this.containsInterval = function() {
            var stringUtil = new opencadcUtil.StringUtil();
            return stringUtil.contains(_xtype, INTERVAL_XTYPE_KEYWORD);
        };

        this.getDataType = function() {
            return dataType;
        };

        this.getDescription = function() {
            return description;
        };

        this.getArraySize = function() {
            return arraysize;
        };
    }

    function Info(_name, _value) {
        var name = _name;
        var value = _value;

        this.getName = function() {
            return name;
        };

        this.getValue = function() {
            return value;
        };

        this.isError = function() {
            return name === 'ERROR';
        };
    }

    function Resource(_id, _name, _type) {
        var ID = _id;
        var name = _name;
        var type = _type;

        this.getID = function() {
            return ID;
        };

        this.isResults = function() {
            return type === 'results';
        };

        this.getName = function() {
            return name;
        };
    }

    /**
   *
   * @param _id
   * @param _cells
   * @constructor
   */
    function Row(_id, _cells) {
        var id = _id;
        var cells = _cells || [];

        this.getID = function() {
            return id;
        };

        this.getCells = function() {
            return cells;
        };

        this.getSize = function() {
            return _cells.length;
        };

        /**
     * Obtain the value of a cell in this row.
     *
     * @param _fieldID    The ID of the cell's field.
     * @returns {*}     Value of the cell.
     */
        this.getCellValue = function(_fieldID) {
            var value = null;

            for (var ci = 0, cl = cells.length; ci < cl; ci++) {
                var cell = cells[ci];
                var cellFieldID = cell.getField().getID();

                if (cellFieldID === _fieldID) {
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
    function Cell(_value, _field) {
        var value = _value;
        var field = _field;

        this.getValue = function() {
            return value;
        };

        this.getField = function() {
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
    function VOTable(_resources, _infos, _description) {
        var resources = _resources || [];
        var infos = _infos || [];
        var description = _description;

        /**
     * Return
     * @returns {*}
     */
        this.getDescription = function() {
            return description;
        };

        /**
     * Return the array of resources.
     * @returns {*|Array}
     */
        this.getResources = function() {
            return resources;
        };

        this.getResultsResources = function() {
            var results = [];
            for (var i = 0, rl = resources.length; i < rl; i++) {
                var r = resources[i];
                if (r.isResults() === true) {
                    results.push(r);
                }
            }
            return results;
        };

        this.getInfos = function() {
            return infos;
        };
    }

    // In case this is imported directly into a page...
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            Resource: Resource,
            Row: Row,
            Cell: Cell,
            Info: Info,
            Field: Field,
            Metadata: Metadata,
            VOTable: VOTable,
            DataTypeFactory: DataTypeFactory
        };
    }
})(opencadcUtil);
