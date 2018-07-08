/**
 * Timeline Control Widget
 *
 * The timeline-control widget provides a UI control to constrain a dataset to a
 * specific window of data.
 *
 * In the context of the widget the following terms apply:
 *  - 'window'    The selected portion of the data set.
 *  - 'data'      An array of data objects; the dataset.
 *  - 'element'   The dom element provided by the caller that the widget is attached to.
 *  - 'container' The internal dom element used by the widget.
 *
 * Instantiation Options
 *
 *  // Configs
 *  width - CSS width. Defaults to the element width.
 *  height - CSS height. Default to element height.
 *  windowSize - Fractional representation of a percentage. 0 < windowStart <= 1.
 *  windowStart - Fractional representation of a percentage. 0 < windowStart < 1.
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
 *  // event handlers
 *  change - event handler.
 *  afterResize - event handler.
 *  beforeWindowResize - event handler.
 *  afterWindowResize - event handler.
 *  beforeWindowMove - event handler.
 *  windowMove - event handler.
 *  afterWindowMove - event handler.
 *
 * Public Methods
 *  windowStart() - Set/get the left edge position.
 *  windowEnd() - Set the size via right edge, get the right edge position
 *  windowSize() - Set/get the windown width.
 *
 *  @Todo Fix display mapping, need bucketing not pixel mapping.
 *  @Todo Fix display so that item at left/right edge always have some relief.
 *  @Todo Make selection widow resizeable via handles.
 *  @Todo Add some testing.
 */
$.widget("custom.timeline", {

  _window: null,

  /*
   * Selection window size as a fractional representation of the ratio of the window
   * width to the display area width.
   *
   * @type {float}
   */
  _windowSize: undefined,

  /*
   * Selection window start (left side) as a percentage (fractional representation)
   * of the entire display area width.
   *
   * @type {float}
   */
  _windowStart: undefined,

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

  // Default options.
  //
  // Notes:
  // 1) In the case of event handlers, they must be defined here in the options
  // object vs as a regular method for them to be automatically bound.
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

    /*
     * Selection window size as a fractional representation of the ratio of the window
     * width to the display area width.
     *
     * @type {float}
     */
    windowSize: .25,

    /*
     * Selection window start (left side) as a percentage (fractional representation)
     * of the entire display area width.
     *
     * @type {float}
     */
    windowStart: .25,

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
    data: null,

    /**
     * Default option change event handler.
     *
     * @param {object} event jQuery Event.
     * @param {object} data Changed data. Varies by event. Typically keys are:
     *  'key', 'oldValue', 'value'.
     * @returns {undefined}
     */
    change: function (event, data) {
      let strVal = (data.key === 'data') ? "data object" : data.value;
console.log("Default change event handler. Key:" + data.key + ", Value:" + strVal);
    },

    /**
     * Default resize event handler.
     *
     * @param {object} event jQuery Event.
     * @param {object} data The widget.
     * @returns {undefined}
     */
    afterResize: function (event, data) {
      let widget = data.context;
      widget._draw();
    },

    /**
     * Default beforeWindowResize event handler.
     *
     * Fires before the view window is resized. Can cancel resize.
     *
     * @param {object} event jQuery Event.
     * @param {object} data
     * @returns {undefined}
     */
    beforeWindowResize: function (event, data) {
//console.log("Default beforeWindowResize event handler. Key:" + data.key + ", Value:" + data.value);
    },

    /**
     * Default afterWindowResize event handler.
     *
     * Fires after the view window is resized.
     *
     * @param {object} event jQuery Event.
     * @param {object} data
     * @returns {undefined}
     */
    afterWindowResize: function (event, data) {
//console.log("Default afterWindowResize event handler. Key:" + data.key + ", Value:" + data.value);
    },

    /**
     * beforeWindowMove
     *
     * Use preventDefault(), stopPropagation() or stopImmediatePropagation() to manage
     * the event. Returning false will not cancel the event.
     *
     * @param {object} event jQuery Event Object.
     * @param {mixed} data
     * @returns {undefined}
     */
    beforeWindowMove: function (event, data) {
//console.log('Default beforeWindowMove event handler. ' + data.windowStart() + ' -> ' + data.windowEnd());
    },

    windowMove: function (event, data) {
// console.log('Default windowMove event handler. '  + data.windowStart() + ' -> ' + data.windowEnd());
    },

    afterWindowMove: function (event, data) {
//console.log('Default afterWindowMove event handler. ' + data.windowStart() + ' -> ' + data.windowEnd());
    }
  },

  /*
   * Private methods
   *
   */

  /**
   *
   * @returns {undefined}
   */
  _create: function () {
    // validate the user options
    for (let key in this.options) {
      if (this.options.hasOwnProperty(key)) {
        if (!(key in $.custom.timeline.prototype.options)) {
          throw new Error('Invalid option: ' + key);
        }
      }
    }

    this._container = $('<div class="timeline"></div>');

    // window element
    this._window = $('<div class="window"></div>');

    // assemble the elements early so we can get width, height, ...
    this._window.appendTo(this._container);
    this._container.appendTo(this.element);

    this._width = Math.floor(this._container.width());
    this._height = Math.floor(this._container.height());

    if (this.options.width !== $.custom.timeline.prototype.options.width) {
      this._setOption("width", this.options.width);
    }

    if (this.options.height !== $.custom.timeline.prototype.options.height) {
      this._setOption("height", this.options.height);
    }

    this._windowStart = 0; // set start so windowSize() doesn't error
    this.windowSize(this.options.widowSize || $.custom.timeline.prototype.options.windowSize);
    this.windowStart(this.options.windowStart || $.custom.timeline.prototype.options.windowStart);

$("#debugConsole").text("px:" + this.windowStart() * this._container.width() + ", %:" + this.windowStart() + ", sz:" + this.windowSize());

    // setup selection window
    let widget = this;  // ToDO: fix this, isn't there a way to bind scope????????????????????

    /**
     * On resize event handler.
     *
     * Hook the browser window resize event.  If the window resize cause the widget to
     * resize, then trigger the widgets custom 'afterResize' event
     *
     * @param {object} event
     */
    $(window).on('resize', function (event) {
      let bResize = false,
        oldValue = {
        "w": widget._width,
        "h": widget._height
      };

      if (widget._container.width() !== widget._width) {
        widget._width = Math.floor(widget._container.width());
        bResize = true;
      }

      if (widget._container.height() !== widget._height) {
        widget._height = Math.floor(widget._container.height());
        bResize = true;
      }

      if (bResize) {
        widget._trigger("afterResize", event, {"oldValue": oldValue, "context": widget});
      }
    });

    // Make the select window draggable.
    this._window.draggable({
      axis: "x",
      containment: "parent",
      distance: 1, // prevent accidental drag

      /**
       * Default jQuery draggable start handler.
       *
       * Relay the event to the widgets 'beforeWindowMove' custom event.
       *
       * @param {object} event
       * @param {object} ui
       * @returns {undefined}
       */
      start: function (event, ui) {
        let x = $(this).position().left;
        widget._trigger('beforeWindowMove', event, {"value": x, "context": widget});
      },

      /**
       * Default jQuery draggable start handler.
       *
       * Relay the event to the widgets 'windowMove' custom event.
       *
       * @param {object} event
       * @param {object} ui
       * @returns {undefined}
       */
      drag: function (event, ui) {
        let x = $(this).position().left;
        $("#debugConsole").text("px:" + x.toFixed(1) + ", %:" + x / widget._container.width() + ", sz:" + widget.windowSize());
        widget._trigger('windowMove', event, {"value": x, "context": widget});
      },

      /**
       * Default jQuery draggable stop handler.
       *
       * Relay the event to the widgets 'afterWindowMove' custom event.
       *
       * @param {object} event
       * @param {object} ui
       * @returns {undefined}
       */
      stop: function (event, ui) {
        let x = $(this).position().left;
        widget.windowStart(x / widget._container.width());
        widget._trigger('afterWindowMove', event, {"value": x, "context": widget});
      }

    }); // draggable

    // load the data
    //
    // Note: display width needs to be set before data is set.
    if (this.options.data !== null) {
      this._setOption('data', this.options.data);
    }
  },

  /**
   *
   * @param {string} key Option name.
   * @param {mixed} value New value.
   * @param {mixed} oldValue The previous value of the option.
   * @param {object} context The context the option was changed from, ofter the widget instance.
   * @returns {undefined}
   */
  _setOption: function (key, value) {
    let oldValue,
      context = this;

    if (!this.options.hasOwnProperty(key)) {
      throw new Error('Invalid option: ' + key);
    }

    oldValue = this.options[key];

    switch (key) {
      case "data":
        this._data(value);
        this._draw();
        break;
      case "width":
        this._container.css({"width":this.options.width});
        this._width = Math.floor(this._container.width());
        break;
      case "height":
        this._container.css({"height":this.options.height});
        this._height = Math.floor(this._container.height());
        break;
      default:
        // empty
    }

    this._super(key, value);

    // do we need to manually trigger a change event?
    this._trigger("change", null, {key: key, value: value, oldValue:oldValue, context:context});
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
    this._super(options);
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
   */
  _data: function (data) {
    let i, len, dataMin, dataMax, oItem;

    this._dataMaxDepth = 1;

    if (!data || !data.length) {
      throw new Error('Invalid data');
    }

    for (i = 0, len = data.length; i < len; i++) {
      if (dataMin === undefined || this._dataCompare(data[i], dataMin) < 0) {
        dataMin = data[i];
      }

      if (dataMax === undefined || this._dataCompare(data[i], dataMax) > 0) {
        dataMax = data[i];
      }
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

      if (data[i].length) {
        if (data[i].length > this._dataMaxDepth) {
          this._dataMaxDepth = data[i].length;
        }
      }
    }

    this._dataRange = (dataMax.key - dataMin.key) + 1;
    this._dataOffset = dataMin.key;

    this.options.data = data;
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

    $('.timeline').find('svg#dataBg').remove();

    let d3tl = d3.select(".timeline");
    let d3svg = d3tl.append("svg").attr("id", 'dataBg').attr("width", '100%').attr("height", '100%');

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
  },

  /**
   *
   * @returns {undefined}
   */
  _destroy: function() {
    // ToDo: ????
  },

  /*
   * Public methods
   *
   */

  /**
   * Change the selection window start (left edge).
   *
   * @param {float} value Fractional representation of a percentage. 0 <= value < 1.
   * @returns {undefined}
   */
  windowStart: function (value) {
    let oldvalue;

    if (value === undefined) {
      return this._windowStart;
    }

    if (value >= 1 || value < 0) {
      throw new Error("Invalid windowStart value: " + value);
    } else if (this._windowSize + value > 1) {
      throw new Error("Invalid windowStart value: " + value + ". The window is too big. windowSize: " + this._windowSize);
    }

    oldvalue = this._windowStart;
    this._windowStart = value;

    this._window.css({
      left: (this._windowStart * 100) + '%'
    });

$("#debugConsole").text("px:" + this.windowStart() * this._container.width() + ", %:" + this.windowStart() + ", sz:" + this.windowSize());

    this._trigger('change', null, {"key": 'windowStart', "oldValue": oldvalue, "value": this._windowStart, "context": this});
  },

  /**
   * Change the selection window width.
   *
   * @param {float} value Fractional representation of a percentage. 0 < value <= 1.
   * @returns {undefined}
   */
  windowSize: function (value) {
    let oldvalue;

    if (value === undefined) {
      return this._windowSize;
    }

    // note we don't allow a window size of 0
    if (value > 1 || value <= 0) {
      throw new Error("Invalid windowSize value: " + value);
    } else if (this._windowStart + value > 1) {
      throw new Error("Invalid windowSize value: " + value + ". The window is too big. windowStart: " + this.options.windowStart);
    }

    oldValue = this._windowSize;
    this._windowSize = value;

    this._window.css({
      width: (this._windowSize * 100) + '%'
    });

$("#debugConsole").text("px:" + this.windowStart() * this._container.width() + ", %:" + this.windowStart() + ", sz:" + this.windowSize());

    this._trigger('change', null, {"key": 'windowSize', "oldValue": oldvalue, "value": this._windowSize, "context": this});
  },

  /**
   * Change the selection window width by specifing the endpoint(right edge).
   *
   * This is a convenience function. windowStart() and windowSize() are sufficient.
   *
   * @param {float} value Fractional representation of a percentage. 0 < value <= 1.
   * @returns {undefined}
   */
  windowEnd: function (value) {
    let oldvalue;

    if (value === undefined) {
      return this._windowStart + this._windowSize;
    }

    if (value > 1 || value <= 0 || value <= this._windowStart) {
      throw new Error("Invalid windowEnd value: " + value);
    }

    oldvalue = this._windowStart + this._windowSize;

    this._windowSize = value - this._windowStart;

    this._window.css({
      width: (this._windowSize * 100) + '%'
    });

$("#debugConsole").text("px:" + this.windowStart() * this._container.width() + ", %:" + this.windowStart() + ", sz:" + this.windowSize());

    this._trigger('change', null, {"key": 'windowEnd', "oldValue": oldvalue, "value": value, "context": this});
  }

});

