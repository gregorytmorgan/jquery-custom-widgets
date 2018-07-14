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
 *  @Todo Fix display so that item at left/right edge always have some relief.
 *  @Todo Make selection widow resizeable via handles.
 *  @Todo Add some testing.
 */
$.widget("custom.barView", {

  /**
   * if data = [4, 12 20], then the data range is (20 - 4) + 1
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

  /**
   * Constructor
   *
   * @returns {undefined}
   */
  _create: function () {
    var key;
    // validate the user options
    for (key in this.options) {
      if (this.options.hasOwnProperty(key) && !$.custom.barView.prototype.options.hasOwnProperty(key)) {
        throw new Error('Invalid option: ' + key);
      }
    }

    this._container = $('<div id="' + this.widgetName + this.uuid + '" class="' + this.widgetName +'"></div>');

    // assemble the elements early so we can get width, height, ...
    this._container.appendTo(this.element);

    //
    // default handlers are set in the constructor so we can bind them to the widget
    //

    this._setOption('change', function (event, data) {
//console.log(this.widgetName + ".change Default handler. Key:" + data.key + ", Value:" + data.value + ', oldValue:' + data.oldValue);
    });

    this._setOption('afterResize',function (event, data) {
      this._draw();
    });

    // call setOptions on all options.
    for (key in this.options) {
      if (this.options.hasOwnProperty(key)) {
        this._setOption(key, this.options[key]);
      }
    }

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
        this._trigger("afterResize", event, {oldValue: oldValue, value: {"w":this._width, "h":this._height}});
      }
    }).bind(this));

    // load the data
    //
    // Note: display width needs to be set before data is set.
    //if (this.options.data !== null) {
    //  this._setOption('data', this.options.data);
    //}

  }, // create

  /**
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
        value = !!value;
        break;
      case "data":
        data = (this.options.cloneData) ? jQuery.extend(true, [], value) : value;
        value = this._preprocessData(data);
        this._isModified = true;
        break;
      case "width":
        this._container.css({"width": value});
        this._width = Math.floor(this._container.width());
        //this._isModified = true;
        break;
      case "height":
        this._container.css({"height": value});
        this._height = Math.floor(this._container.height());
        //this._isModified = true;
        break;
      case "create":
      case "change":
      case "afterResize":
        if (typeof value === 'function') {
          value = value.bind(this);
        }
        break;
      default:
        // empty
    } // switch

    this._super(key, value);

    if (this._isModified) {
      this._draw();
    }

    // chk if the new value is different. Use JSON.stringify() generally, but use
    // valueOf for functions.

    if (value === undefined || value === null) {
      lval = "UNDEFINED_OR_NULL";
    } else if (typeof value === 'function') {
      //lval = value.valueOf();
      lval = value;
    } else {
      lval = JSON.stringify(value);
    }

    if (oldValue === undefined || oldValue === null) {
      rval = "UNDEFINED_OR_NULL";
    } else if (typeof oldValue === 'function') {
      //rval = oldValue.valueOf();
      rval = oldValue;
    } else {
      rval = JSON.stringify(oldValue);
    }

    if (lval !== rval) {

//console.log('+++++++++++++++++');
//console.log(lval);
//console.log(rval);

      this._trigger("change", null, {key: key, value: value, oldValue:oldValue});
    }

//console.log(this.widgetName + '._setOption - exit');
  },

  /**
   * Set the options this.options at instantiation.
   *
   * This is called automatically by the base widget class.
   *
   * @param {object} options
   * @returns {undefined}
   */
  _setOptions: function (options) {
//console.log(this.widgetName + '._setOptions - entry');
    this._super(options);
//console.log(this.widgetName + '._setOptions - exit');
  },

  /**
   * Return the ratio between the widget display width and the data range.
   *
   * @returns {float}
   * @throws Exception
   */
  _displayFactor: function () {
    if (!this._width) {
      throw new Error('Invalid display width');
    }

    if (!this._dataRange) {
      throw new Error('Invalid data range');
    }

    return this._width / this._dataRange;
  },

  /**
   * Given a data index return the display index.
   *
   * @param {integer} index
   * @returns {float}
   */
  _dataIndexToDisplayIndex: function (index) {
    return (index - this._dataOffset) * this._displayFactor();
  },

  /**
   * Given a display index return the display index.
   *
   * @param {type} index
   * @returns {undefined}
   */
  _displayIndexToDataIndex: function (index) {
    (index + this._dataOffset) / this._displayFactor(); // ToDo: need to round this to integer?????????????
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

    if (!data.length) {
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

    this._dataRange = (dataMax.key - dataMin.key) + 1;
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

    if (!this.options.data.length) {
      return;
    }

    this._container.find('svg.dataBg').remove();

    let d3tl = d3.select(this._container[0]); // get the raw DOM element
    let d3svg = d3tl.append("svg").attr("id", this.uuidv4()).classed('dataBg', true).attr("width", '100%').attr("height", '100%');

    for (i = 0, len = this.options.data.length; i < len; i += 1) {
      if ($.type(this.options.data[i]) === "array") {
        x = this._dataIndexToDisplayIndex(this.options.data[i][0].key);
        y = ((1 / this._dataMaxDepth) * this.options.data[i].length) * this._height;
        label = this.options.data[i].length.toString();
      } else {
        x = this._dataIndexToDisplayIndex(this.options.data[i].key);
        y = ((1 / this._dataMaxDepth))  * this._height;
        label = "1";
      }

      d3svg.append("line")
        .attr("x1", x).attr("y1", this._height)
        .attr("x2", x).attr("y2", this._height - y)
        .attr("stroke-width", 2).attr("stroke", "blue")
        .append("title").text(label);
    }

    this._isModified = false;
  },

  /**
   * Create a RFC4122 version 4 compliant UUID.
   *
   * @returns {Number|Array}
   */
  uuidv4: function () {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
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

