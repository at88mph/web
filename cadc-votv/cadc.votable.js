;(function (StringUtil, undefined) {
  'use strict'

  /**
   *
   * Sample VOTable XML Document - Version 1.2 .
   *
   * <VOTABLE version="1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   * xmlns="http://www.ivoa.net/xml/VOTable/v1.2"
   * xmlns:stc="http://www.ivoa.net/xml/STC/v1.30" >
   <RESOURCE name="myFavouriteGalaxies">
   <TABLE name="results">
   <DESCRIPTION>Velocities and Distance estimations</DESCRIPTION>
   <GROUP ID="J2000" utype="stc:AstroCoords">
   <PARAM datatype="char" arraysize="*" ucd="pos.frame" name="cooframe"
   utype="stc:AstroCoords.coord_system_id" value="UTC-ICRS-TOPO" />
   <FIELDref ref="col1"/>
   <FIELDref ref="col2"/>
   </GROUP>
   <PARAM name="Telescope" datatype="float" ucd="phys.size;instr.tel"
   unit="m" value="3.6"/>
   <FIELD name="RA"   ID="col1" ucd="pos.eq.ra;meta.main" ref="J2000"
   utype="stc:AstroCoords.Position2D.Value2.C1"
   datatype="float" width="6" precision="2" unit="deg"/>
   <FIELD name="Dec"  ID="col2" ucd="pos.eq.dec;meta.main" ref="J2000"
   utype="stc:AstroCoords.Position2D.Value2.C2"
   datatype="float" width="6" precision="2" unit="deg"/>
   <FIELD name="Name" ID="col3" ucd="meta.id;meta.main"
   datatype="char" arraysize="8*"/>
   <FIELD name="RVel" ID="col4" ucd="spect.dopplerVeloc" datatype="int"
   width="5" unit="km/s"/>
   <FIELD name="e_RVel" ID="col5" ucd="stat.error;spect.dopplerVeloc"
   datatype="int" width="3" unit="km/s"/>
   <FIELD name="R" ID="col6" ucd="pos.distance;pos.heliocentric"
   datatype="float" width="4" precision="1" unit="Mpc">
   <DESCRIPTION>Distance of Galaxy, assuming H=75km/s/Mpc</DESCRIPTION>
   </FIELD>
   <DATA>
   <TABLEDATA>
   <TR>
   <TD>010.68</TD><TD>+41.27</TD><TD>N  224</TD><TD>-297</TD><TD>5</TD><TD>0.7</TD>
   </TR>
   <TR>
   <TD>287.43</TD><TD>-63.85</TD><TD>N 6744</TD><TD>839</TD><TD>6</TD><TD>10.4</TD>
   </TR>
   <TR>
   <TD>023.48</TD><TD>+30.66</TD><TD>N  598</TD><TD>-182</TD><TD>3</TD><TD>0.7</TD>
   </TR>
   </TABLEDATA>
   </DATA>
   </TABLE>
   </RESOURCE>
   </VOTABLE>

   The Data Model can be expressed as:
   VOTable 	= 	hierarchy of Metadata + associated TableData, arranged as a set of Tables
   Metadata 	= 	Parameters + Infos + Descriptions + Links + Fields + Groups
   Table 	= 	list of Fields + TableData
   TableData 	= 	stream of Rows
   Row 	= 	list of Cells
   Cell 	=
   Primitive
   or variable-length list of Primitives
   or multidimensional array of Primitives
   Primitive 	= 	integer, character, float, floatComplex, etc (see table of primitives below).
   *
   * The VOTable object.
   *
   * @param {Metadata}  __metadata    The metadata from the source.
   * @param {[]}  __resources   The resources from the source.
   * @constructor
   */
  function VOTable (__metadata, __resources) {
    this.resources = __resources
    this.metadata = __metadata
  }

  VOTable.prototype.getResources = function () {
    return this.resources
  }

  VOTable.prototype.getMetadata = function () {
    return this.metadata
  }

  /**
   * VOTable Metadata class.
   *
   * @param __parameters
   * @param __infos
   * @param _description
   * @param __links
   * @param __fields
   * @param __groups
   * @constructor
   */
  function Metadata (__parameters, __infos, _description, __links, __fields, __groups) {
    this.parameters = __parameters || []
    this.infos = __infos || []
    this.description = _description
    this.links = __links || []
    this.fields = __fields || []
    this.groups = __groups || []
  }

  Metadata.prototype.getInfos = function () {
    return this.infos
  }

  Metadata.prototype.getDescription = function () {
    return this.description
  }

  Metadata.prototype.getParameters = function () {
    return this.parameters
  }

  Metadata.prototype.getFields = function () {
    return this.fields
  }

  /**
   * Set this metadata's fields.
   *
   * @param {[]}  _fields  Array of values.
   */
  Metadata.prototype.setFields = function (_fields) {
    this.fields = _fields
  }

  Metadata.prototype.getLinks = function () {
    return this.links
  }

  Metadata.prototype.getGroups = function () {
    return this.groups
  }

  Metadata.prototype.addField = function (_field) {
    this.getFields().push(_field)
  }

  Metadata.prototype.insertField = function (_fieldIndex, _field) {
    this.getFields()[_fieldIndex] = _field
  }

  Metadata.prototype.hasFieldWithID = function (_fieldID) {
    return this.getField(_fieldID) != null
  }

  /**
   * Obtain a Field by its ID.
   * @param _fieldID    The field ID to obtain a field for.
   *
   * @return {cadc.vot.Field}   Field instance, or null if not found.
   */
  Metadata.prototype.getField = function (_fieldID) {
    if (_fieldID) {
      const currFields = this.getFields()
      const cfl = currFields.length
      for (let f = 0; f < cfl; f++) {
        const nextField = currFields[f]

        if (nextField && currFields[f].getID() == _fieldID) {
          return nextField
        }
      }
    }

    return null
  }

  /**
   * Datatype constructor taking the value or name of this datatype.
   * @param {String} _datatypeValue The value (name) of the datatype.  Defaults to 'varchar'.
   * @constructor
   */
  function Datatype (_datatypeValue) {
    this.datatypeValue = _datatypeValue || 'varchar'

    this._STRING_TYPES_ = [
      'varchar',
      'char',
      'adql:VARCHAR',
      'adql:CLOB',
      'adql:REGION',
      'polygon',
      'point',
      'circle',
      'interval',
      'uri'
    ]
    this._INTEGER_TYPES_ = ['int', 'long', 'short']
    this._FLOATING_POINT_TYPES_ = ['float', 'double', 'adql:DOUBLE', 'adql:FLOAT']
    this._TIMESTAMP_TYPES_ = ['timestamp', 'adql:TIMESTAMP']

    if (
      this.datatypeMatches(
        this._STRING_TYPES_.concat(this._INTEGER_TYPES_, this._FLOATING_POINT_TYPES_, this._TIMESTAMP_TYPES_, 'boolean')
      ) === false
    ) {
      throw new Error(`Datatype ${this.datatypeValue} is not a valid entry.`)
    }
  }

  Datatype.prototype.getDatatypeValue = function () {
    return this.datatypeValue
  }

  Datatype.prototype.isNumeric = function () {
    // will accept float, double, long, int, short, real, adql:DOUBLE,
    // adql:INTEGER, adql:POINT, adql:REAL
    //
    return !this.isCharDatatype() && !this.isTimestamp() && !this.isBoolean()
  }

  /**
   * Return whether this datatype is a Timestamp.
   * @returns {boolean}   True if timestamp, False otherwise.
   */
  Datatype.prototype.isTimestamp = function () {
    return this.datatypeMatches(this._TIMESTAMP_TYPES_)
  }

  Datatype.prototype.isBoolean = function () {
    return this.getDatatypeValue() === 'boolean'
  }

  Datatype.prototype.isFloatingPointNumeric = function () {
    return this.datatypeMatches(this._FLOATING_POINT_TYPES_)
  }

  Datatype.prototype.isIntegerNumeric = function () {
    return this.datatypeMatches(this._INTEGER_TYPES_)
  }

  Datatype.prototype.isCharDatatype = function () {
    return this.datatypeMatches(this._STRING_TYPES_)
  }

  Datatype.prototype.datatypeMatches = function (_datatypes) {
    const dataTypeValue = this.getDatatypeValue()
    const stringUtil = new StringUtil()
    const dl = _datatypes.length
    for (let stIndex = 0; stIndex < dl; stIndex++) {
      if (stringUtil.contains(dataTypeValue, _datatypes[stIndex])) {
        return true
      }
    }
    return false
  }

  /**
   *
   * @param _name
   * @param _id
   * @param _ucd
   * @param _utype
   * @param _unit
   * @param _xtype
   * @param __datatype    Datatype object.
   * @param _arraysize
   * @param _description
   * @param label
   * @constructor
   */
  function Field (_name, _id, _ucd, _utype, _unit, _xtype, __datatype, _arraysize, _description, label) {
    this._INTERVAL_XTYPE_KEYWORD_ = 'INTERVAL'
    const types = this.set(__datatype, _xtype)

    this.name = _name
    this.id = _id
    this.ucd = _ucd
    this.utype = _utype
    this.unit = _unit
    this.xtype = types._xt
    this.datatype = types._dt
    this.arraysize = _arraysize
    this.description = _description
    this.label = label
  }

  Field.prototype.getName = function () {
    return this.name
  }

  Field.prototype.getID = function () {
    return this.id
  }

  Field.prototype.getLabel = function () {
    return this.label
  }

  Field.prototype.getUType = function () {
    return this.utype
  }

  Field.prototype.getUCD = function () {
    return this.ucd
  }

  Field.prototype.getUnit = function () {
    return this.unit
  }

  Field.prototype.getXType = function () {
    return this.xtype
  }

  Field.prototype.containsInterval = function () {
    var stringUtil = new StringUtil()
    return (
      stringUtil.contains(this.getXType(), this._INTERVAL_XTYPE_KEYWORD_, false) ||
      stringUtil.contains(this.getDatatype().getDatatypeValue(), _INTERVAL_XTYPE_KEYWORD_, false)
    )
  }

  Field.prototype.getDatatype = function () {
    return this.datatype
  }

  Field.prototype.getDescription = function () {
    return this.description
  }

  Field.prototype.getArraySize = function () {
    return this.arraysize
  }

  Field.prototype.set = function (_dtype, _xtype) {
    var dt, xt
    if (_xtype) {
      // xtype = 'polygon' | 'circle' | 'point' | 'interval' | 'uri'
      // over-rides the datatype of 'double'
      dt = new Datatype(_xtype)
    } else if (_dtype) {
      if (typeof _dtype === 'object') {
        dt = _dtype
      } else {
        if (this._STRING_UTIL_.contains(_dtype, INTERVAL_XTYPE_KEYWORD)) {
          xt = INTERVAL_XTYPE_KEYWORD
        }
        dt = new Datatype(_dtype)
      }
    } else {
      dt = new Datatype('varchar')
    }
    return {
      _dt: dt,
      _xt: xt
    }
  }

  /**
   *
   * @param _name
   * @param _id
   * @param _ucd
   * @param _utype
   * @param _unit
   * @param _xtype
   * @param __datatype
   * @param _arraysize
   * @param _description
   * @param _value
   * @constructor
   */
  function Parameter (_name, _id, _ucd, _utype, _unit, _xtype, __datatype, _arraysize, _description, _value) {
    this.name = _name
    this.id = _id
    this.ucd = _ucd
    this.utype = _utype
    this.unit = _unit
    this.xtype = _xtype
    this.datatype = __datatype || {}
    this.arraysize = _arraysize
    this.description = _description
    this.value = _value
  }

  Parameter.prototype.getName = function () {
    return this.name
  }

  Parameter.prototype.getValue = function () {
    return this.value
  }

  Parameter.prototype.getUType = function () {
    return this.utype
  }

  Parameter.prototype.getID = function () {
    return this.id
  }

  Parameter.prototype.getUCD = function () {
    return this.ucd
  }

  Parameter.prototype.getDescription = function () {
    return this.description
  }

  /**
   * Info object.
   * @param {String} _name  This info's Name.
   * @param {*} _value    The value, usually a string.
   * @constructor
   */
  function Info (_name, _value) {
    this.name = _name
    this.value = _value
  }

  Info.prototype.getName = function () {
    return _selfInfo.name
  }

  Info.prototype.getValue = function () {
    return _selfInfo.value
  }

  Info.prototype.isError = function () {
    return this.getName() === 'ERROR'
  }

  /**
   *
   * @param {*} _ID
   * @param {*} _name
   * @param {*} _metaFlag
   * @param {*} __metadata
   * @param {*} __tables
   * @constructor
   */
  function Resource (_ID, _name, _metaFlag, __metadata, __tables) {
    this.ID = _ID
    this.name = _name
    this.metaFlag = _metaFlag
    this.metadata = __metadata
    this.tables = __tables
  }

  Resource.prototype.getTables = function () {
    return this.tables
  }

  Resource.prototype.getID = function () {
    return this.ID
  }

  Resource.prototype.isMeta = function () {
    return this.metaFlag
  }

  Resource.prototype.getName = function () {
    return this.name
  }

  /**
   * @returns {Metadata} This Resource's Metadata object.
   */
  Resource.prototype.getMetadata = function () {
    return this.metadata
  }

  Resource.prototype.getDescription = function () {
    return this.getMetadata().getDescription()
  }

  Resource.prototype.getInfos = function () {
    return this.getMetadata().getInfos()
  }

  /**
   *
   * @param __metadata
   * @param __tabledata
   * @constructor
   */
  function Table (__metadata, __tabledata) {
    this.metadata = __metadata
    this.tabledata = __tabledata
  }

  Table.prototype.getTableData = function () {
    return this.tabledata
  }

  /**
   * @returns {Metadata}  Metadata for this Table.
   */
  Table.prototype.getMetadata = function () {
    return this.metadata
  }

  Table.prototype.getFields = function () {
    return this.getMetadata().getFields()
  }

  /**
   *
   * @param _id
   * @param __cells
   * @constructor
   */
  function Row (_id, __cells) {
    this.id = _id
    this.cells = __cells || []
  }

  Row.prototype.getID = function () {
    return this.id
  }

  Row.prototype.getCells = function () {
    return this.cells
  }

  Row.prototype.getSize = function () {
    return this.getCells().length
  }

  /**
   * Obtain the value of a cell in this row.
   *
   * @param _fieldID    The ID of the cell's field.
   * @returns {*}     Value of the cell.
   */
  Row.prototype.getCellValue = function (_fieldID) {
    const allCells = this.getCells()
    for (let i = 0, al = allCells.length; i < allCells; i++) {
      const cell = allCells[i]
      const cellFieldID = cell.getField().getID()

      if (cellFieldID === _fieldID) {
        return cell.getValue()
      }
    }

    return null
  }

  /**
   * Cell object within a row.
   *
   * @param _value
   * @param __field
   * @constructor
   */
  function Cell (_value, __field) {
    this.value = _value
    this.field = __field
  }

  Cell.prototype.getValue = function () {
    return this.value
  }

  Cell.prototype.getField = function () {
    return this.field
  }

  /**
   *
   * @param __rows
   * @param _longestValues
   * @constructor
   */
  function TableData (__rows, _longestValues) {
    this.rows = __rows
    this.longestValues = _longestValues || {}
  }

  TableData.prototype.getRows = function () {
    return this.rows
  }

  TableData.prototype.getLongestValues = function () {
    return this.longestValues
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      VOTable: VOTable,
      Metadata: Metadata,
      Datatype: Datatype,
      Field: Field,
      Resource: Resource,
      Table: Table,
      TableData: TableData,
      Row: Row,
      Cell: Cell,
      Parameter: Parameter,
      Info: Info
    }
  }
})(StringUtil)
