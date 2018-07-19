/**
 * BarView Widget
 *
 * The BarView widget provides a bargraph like presentation of a data set.
 *
 * In the context of the widget the following terms apply:
 *  - 'data'      An array of data objects; the dataset.
 *  - 'element'   The dom element provided by the caller that the widget is attached to.
 *  - 'container' The internal dom element used by the widget.
 *
 * Instantiation Options
 *
 *  // Configs
 *  width - CSS width. Defaults to the element width.
 *  height - CSS height. Default to element height.
 *  data - Array of data objects. A data object is a single key value pair object,
 *  or an array of key/value pair objects:
 *  [
 *    {'key': 44, 'value': 324},
 *    [
 *      {'key': 123, 'value': 8484},
 *      {'key': 37, 'value': 1161}
 *      ...
 *    ],
 *    ...
 *  ]
 *
 *  // event handlers - this can be defined/passed in at instantiation time.
 *  change - event handler.
 *  afterResize - event handler.
 *
 * Public Methods
 *  ...
 *
 *  @Todo Fix display mapping, need bucketing not pixel mapping.
 *  @Todo Make selection widow resizeable via handles.
 */
$.widget("custom.barView", {

  /**
   * if data = [4, 12 20], then the data width is (20 - 4)
   */
  _dataRange: undefined,

  /**
   * if data = [4, 12 20], then the offset is 4.
   */
  _dataOffset: undefined,

  /**
   * Data items with the same key are combined. Depth refers to the number of
   * items with a given key.
   *
   * @type {integer}
   */
  _dataMaxDepth: undefined,

  /**
   * The width of the widget in pixels.
   *
   * @type {float}
   */
  _width: undefined,

  /**
   * The height of the widget in pixels.
   *
   * @type {float}
   */
  _height: undefined,

  /**
   * Has the data been modified since the last draw?
   *
   * @type {boolean}
   */
  _isModified: false,

  // Default options.
  //
  // Notes:
  //
  // 1) In the case of event handlers, they must be defined here in the options
  // object vs as a regular method for them to be automatically bound.
  //
  // 2) All options must be defined with a default, otherwise an exception is thrown.
  //
  options: {

    /**
     * The user specified widget width.
     *
     * CSS width. Defaults to the element width.
     *
     * @type {string}
     */
    width: '100%',

    /**
     * The user specified widget height.
     *
     * CSS width. Defaults to the element height.
     *
     * @type {string}
     */
    height: '100%',

    /**
     * @type {array} data Array of data objects.
     * [
     *   {'key': 44, 'value': 324},
     *   [
     *    {'key': 123, 'value': 8484},
     *    {'key': 37, 'value': 1161}
     *    ...
     *   ],
     *   ...
     * ]
     */
    data: [],

    /**
     * When setting the widget data, should the data set be copied so it
     * remains unchanged? Otherwise, it may be changed, e.g items with the same
     * key will be aggregated.
     *
     * @type {boolean}
     */
    cloneData: true,

    /**
     * Numer of pixels of display relief - pre.
     *
     * @type {integer}
     */
    preRelief: 10,

    /**
     * Numer of pixels of display relief - post.
     *
     * @type {integer}
     */
    postRelief: 10,

    /**
     * Option change event handler.
     *
     * The default handler is set in _create().
     *
     * handler(jQueryEvent, data)
     */
    change: null,

    /**
     * Resize event handler.
     *
     * The default handler is set in _create().
     *
     * handler(jQueryEvent, data)
     */
    afterResize: null
  }, // options

  /*
   * Private methods
   *
   */

  /*
   * Constructor
   *
   */
  _create: function () {
    let key;

    this._super();

    this._container = $('<div id="' + this.widgetName + this.uuid + '" class="' + this.widgetName +'"></div>');

    // assemble the elements early so we can get width, height, ...
    this._container.appendTo(this.element);

    // call setOptions on all options.
    for (key in $.custom.barView.prototype.options) {
      this._setOption(key, this.options[key] || $.custom.barView.prototype.options[key]);
    }

    // after setting all the options, see if we triggered a draw.
    if (this._isModified) {
      this._draw();
    }

    // default handlers are set in the constructor so we can bind them to the widget.
    // Setting them statically within the default options object doesn't set the proper context.
    this._setOption('afterResize',function (event, data) {
      this._draw();
    });

    /**
     * On resize event handler.
     *
     * Hook the browser window resize event.  If the window resize cause the widget to
     * resize, then trigger the widgets custom 'afterResize' event.
     *
     * @param {object} event
     */
    $(window).on('resize', (function (event) {
      let bResize = false,
        oldValue = {
        "w": this._width,
        "h": this._height
      };

      if (this._container.width() !== this._width) {
        this._width = Math.floor(this._container.width());
        bResize = true;
      }

      if (this._container.height() !== this._height) {
        this._height = Math.floor(this._container.height());
        bResize = true;
      }

      if (bResize) {
        this._trigger("afterResize", event, {value: {"w":this._width, "h":this._height}, oldValue: oldValue, context: this});
      }
    }).bind(this));

  }, // create

  /**
   * Override the option call to we can validate the options.
   *
   * @param {type} key
   * @param {type} value
   * @returns {barViewAnonym$0@call;_superApply}
   */
  option: function (key, value) {
    let k;

    if ($.type(key) === "string") {
      if (!this.options.hasOwnProperty(key)) {
        throw new Error("Invalid option " + key);
      }
    } else if ($.type(key) === "object") {
      for (k in key) {
        if (!this.options.hasOwnProperty(k)) {
          throw new Error("Invalid option " + k);
        }
      }
    } else {
      throw new Error("Invalid option " + key);
    }

    return this._superApply(arguments);
  },

  /**
   * Set a single key in this.options.
   *
   * @param {string} key Option name.
   * @param {mixed} value New value.
   * @returns {undefined}
   */
  _setOption: function (key, value) {
    let data, oldValue, lval, rval;

//console.log(this.widgetName + '._setOption - entry');

//console.log(this.widgetName + '._setOption - key: ' + key);

    oldValue = this.options[key];

    switch (key) {
      case "cloneData":
        value = $.trim(value.toString().toLowerCase());
        this.options.cloneData = (value === "0" || value === "false") ? false : true;
        break;
      case "data":
        data = (this.options.cloneData) ? jQuery.extend(true, [], value) : value;
        this._isModified = true;
        this.options.data = this._preprocessData(data);
        break;
      case "preRelief":
        value = parseInt(value);
        if (isNaN(value) || value < 0) {
          throw new Error("Invalid preRelief value: " + value);
        }
        this._isModified = true;
        this.options.preRelief = value;
        break;
      case "postRelief":
        value = parseInt(value);
        if (isNaN(value) || value < 0) {
          throw new Error("Invalid postRelief value: " + value);
        }
        this._isModified = true;
        this.options.postRelief = value;
        break;
      case "width":
        this._container.css({width: value});
        this._width = Math.floor(this._container.width());
        this._isModified = true;
        this.options.width = value;
        break;
      case "height":
        this._container.css({"height": value});
        this._height = Math.floor(this._container.height());
        this._isModified = true;
        this.options.height = value;
        break;
      case "create":
      case "change":
      case "afterResize":
        if (typeof value === 'function') {
          this.options[key] = value.bind(this);
        } else if (typeof value === 'undefined' || value === null) {
          this.options[key] = null;
        } else {
          throw new Error('Invalid function');
        }
        break;
      default:
        this._super(key, value);
    } // switch

    // Check if the new value is different from old. Use JSON.stringify() generally,
    // but use valueOf() for functions.
    if (value === undefined || value === null) {
      lval = "UNDEFINED_OR_NULL";
    } else if (typeof value === 'function') {
      lval = value.valueOf();
    } else {
      lval = JSON.stringify(value);
    }

    if (oldValue === undefined || oldValue === null) {
      rval = "UNDEFINED_OR_NULL";
    } else if (typeof oldValue === 'function') {
      rval = oldValue.valueOf();
    } else {
      rval = JSON.stringify(oldValue);
    }

    if (lval !== rval) {
      this._trigger("change", null, {value:this.options[key], oldValue: oldValue, context: this, key: key});
    }

//console.log(this.widgetName + '._setOption - exit');
  },

  /**
   * Set multiple keys in this.options.
   *
   * This is also called by widget.option(key, value)
   *
   * @param {object} options
   * @returns {undefined}
   */
  _setOptions: function (options) {
//console.log(this.widgetName + '._setOptions - entry');
    this._super(options);

    if (this._isModified) {
      this._draw();
    }
//console.log(this.widgetName + '._setOptions - exit');
  },

  /**
   * Return the ratio between the widget display width and the data width.
   *
   * @returns {float}
   * @throws Exception
   */
  _displayFactor: function () {
    if (typeof this._width === 'undefined') {
      throw new Error('Invalid display width');
    }

    if (this._width - this.options.preRelief - this.options.postRelief < 1) {
      throw new Error('Invalid display width. Width is less than relief');
    }

    // a data width of 0 is valid: there is only one data point
    if (typeof this._dataRange === 'undefined') {
      throw new Error('Invalid data width');
    }

    // a dataRange of 0 is a single data point
    if (this._dataRange === 0) {
      return (this._width - this.options.preRelief - this.options.postRelief);
    } else {
      return (this._width - this.options.preRelief - this.options.postRelief) / this._dataRange;
    }
  },

  /**
   * Given a data value return the display X.
   *
   * @param {integer} value
   * @returns {float}
   */
  _dataValueToDisplayX: function (value) {
    return ((value - this._dataOffset) * this._displayFactor()) + this.options.preRelief;
  },

  /**
   * Given a display x return the data value.
   *
   * @param {type} x Display x.
   * @returns {undefined}
   */
  __displayXToDataValue: function (x) {
    (x + this._dataOffset) / this._displayFactor(); // ToDo: need to round this to integer?????????????
  },

  /**
   * Setup the data.
   *
   * 1) Sorts data by key.
   * 3) Aggregates duplicate keys
   * 3) Discovers _dataMaxDepth, _dataRange, _dataOffset
   *
   * @param {array} data Array of data objects.
   * [
   *   {'key': 44, 'value': 343124},
   *   {'key': 123, 'value': 8484},
   *   ...
   * ]
   * @returns {array}
   */
  _preprocessData: function (data) {
    let i, len, dataMin, dataMax, oItem;

    this._dataMaxDepth = 1;

    if (data.length === 0) {
      this._dataRange = 0;
      this._dataOffset = 0;
      this._dataMaxDepth = 0;
      return data;
    }

    data.sort(this._dataCompare);

    // walk data and find items with same key, combine them into a single index
    for (i = 0; i < data.length - 1; i +=1) {
      oItem = ($.type(data[i]) === "array") ? data[i][0] : data[i];
      if (oItem.key === data[i + 1].key) {
        if ($.type(data[i]) === "array") {
          data[i].push(data[i + 1]);
        } else {
          let tmp = data[i];
          data[i] = [tmp, data[i + 1]];
        }

        data.splice(i + 1, 1);
        i--;
      }
    }

    for (i = 0, len = data.length; i < len; i++) {
      if (dataMin === undefined || this._dataCompare(data[i], dataMin) < 0) {
        dataMin = ($.type(data[i]) === "array") ? data[i][0] : data[i];
      }

      if (dataMax === undefined || this._dataCompare(data[i], dataMax) > 0) {
        dataMax = ($.type(data[i]) === "array") ? data[i][0] : data[i];
      }

      if (data[i].length) {
        if (data[i].length > this._dataMaxDepth) {
          this._dataMaxDepth = data[i].length;
        }
      }
    }

    this._dataRange = (dataMax.key - dataMin.key);
    this._dataOffset = dataMin.key;

    return data;
  },

  /**
   * Compare data items.
   *
   * Maybe this could be an option?
   *
   * How to deal with dates? Force user to convert to timestamp?
   *
   * @param {object} a Data object {key:integer, value:mixed} or [{key:integer, value:mixed}, ...]
   * @param {object} b Data object {key:integer, value:mixed} or [{key:integer, value:mixed}, ...]
   * @returns {integer} Returns -1 if a < b, 0 if equal, 1 if a > b
   */
  _dataCompare: function (a, b) {
    let aKey = ($.type(a) === "array") ? a[0].key : a.key,
      bKey = ($.type(b)  === "array") ? b[0].key : b.key;

    if (aKey === bKey) {
      return 0;
    }

    return (aKey > bKey) ? 1 : -1;
  },

  /**
   * Draw the widget background representing the entire data set.
   *
   * @returns {undefined}
   */
  _draw: function () {
    let i, len, x, y, label;

    // always update isModifed before returning, setting w/h sets isModified and
    // triggers a redraw even when there is no data
    this._isModified = false;

    if (typeof this.options.data === 'undefined') {
      return;
    }

    this._container.find('svg.dataBg').remove();

    let d3tl = d3.select(this._container[0]); // get the raw DOM element
    let d3svg = d3tl.append("svg").attr("id", this._uuid()).classed('dataBg', true).attr("width", '100%').attr("height", '100%');

    for (i = 0, len = this.options.data.length; i < len; i += 1) {
      if ($.type(this.options.data[i]) === "array") {
        x = this._dataValueToDisplayX(this.options.data[i][0].key);
        y = ((1 / this._dataMaxDepth) * this.options.data[i].length) * this._height;
        label = this.options.data[i][0].key + " (" + this.options.data[i].length.toString() + ")";
      } else {
        x = this._dataValueToDisplayX(this.options.data[i].key);
        y = ((1 / this._dataMaxDepth))  * this._height;
        label = this.options.data[i].key + " (1)";
      }

      d3svg.append("line")
        .attr("x1", x).attr("y1", this._height)
        .attr("x2", x).attr("y2", this._height - y)
        .attr("stroke-width", 2).attr("stroke", "blue")
        .append("title").text(label);
    }
  },

  /**
   * Create a RFC4122 version 4 compliant UUID.
   *
   * @returns {Number|Array}
   */
  _uuid: function () {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  },

  /**
   * ToDo Refactor to pass data indexes instead of slicing data and passing a whole
   * other array when recursing
   *
   * @param {string} key
   * @param {array} data
   * @param {integer} start
   * @param {integer} end
   * @returns {Number}
   */
  _find: function (key, data, start, end) {
    let leftStart, leftEnd, rightStart, rightEnd,
      oKey = {"key": key};

    if (data.length === 0) {
      return -1;
    }

    if (typeof start === 'undefined') {
      start = 0;
    }

    if (typeof end === 'undefined') {
      end = data.length - 1;
    }

    if (start === end) {
      if (this._dataCompare(oKey, data[start]) === 0) {
        return start; // found
      } else {
        return -1; // not found
      }
    }

    leftEnd = Math.floor(end - start / 2 ) - 1;

    let cmp = this._dataCompare(oKey, data[leftEnd]);

    // keep looking
    if (cmp === 0) {
      return leftEnd;
    } else if (cmp < 0) {
      leftStart = start;
      return this._find(oKey.key, data, leftStart, leftEnd);
    } else {
      rightStart = leftEnd + 1;
      rightEnd = end;
      return this._find(oKey.key, data, rightStart, rightEnd);
    }
  },

  /**
   *
   * @returns {undefined}
   */
  _destroy: function() {
console.log(this.widgetName + this.uuid + '._destroy - entry/exit');
  }

  /*
   * Public methods
   *
   */

});

