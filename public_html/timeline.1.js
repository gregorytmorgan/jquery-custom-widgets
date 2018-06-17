/**
 * Timeline Control Widget
 *
 * The timeine-control widget provides a UI control to constrain a dataset to a
 * specific window of data.
 *
 * In the context of the widget the following terms apply:
 *  - 'window'    The selected portion of the data set.
 *  - 'data'      An array of data objects; the dataset.  The provided data is
 *                considered immutable and will not be modified.
 *  - 'element'   The dom element provided by the call that the widget is attached to.
 *  - 'container' The internal dom element used by the widget.
 *
 * Instantiation Options
 *
 *  // Configs
 *  width - CSS width. Defaults to the element width.
 *  height - CSS height. Default to element height.
 *  windowSize - Fractional representation of a percentage. 0 < windowStart <= 1.
 *  windowStart - Fractional representation of a percentage. 0 < windowStart < 1.
 *  data - Array of data.
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
 *  data()
 *
 */
$.widget("custom.timeline", {

  _window: null,

  /**
   * @type {string} CSS string
   */
  _DEFAULT_WIDTH: '100%',

  /**
   * @type {string} CSS string
   */
  _DEFAULT_HEIGHT: '100%',

  /**
   * @type {float}
   */
  _DEFAULT_WINDOW_SIZE: .25,

  /**
   * @type {float}
   */
  _DEFAULT_WINDOW_START: .25,

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
   *  @type {float}
   */
  _displayWidth: undefined,

  /**
   * @type {float}
   */
  _displayHeight: undefined,

  /**
   * if data = [4, 12 20], then the data range is (20 - 4) + 1
   */
  _dataRange: undefined,

  /**
   * if data = [4, 12 20], then the offset is 4.
   */
  _dataOffset: undefined,

  /**
   * @type {array} data Array of data objects.
   * [
   *   {'key': 44, 'value': 343124},
   *   {'key': 123, 'value': 8484},
   *   ...
   * ]
   */
  _data: undefined,

  // data items with the same key are combined. Depth refers to the number of
  // items with a given key
  _dataMaxDepth: undefined,

  // Default options.
  //
  // Notes:
  // 1) In the case of event handlers, they must be defined here in the options
  // object vs as a regular method for them to be automatically bound.
  options: {

    /*
     * Selection window size as a fractional representation of the ratio of the window
     * width to the display area width.
     *
     * @type {float}
     */
    windowSize: undefined,

    /*
     * Selection window start (left side) as a percentage (fractional representation)
     * of the entire display area width.
     *
     * @type {float}
     */
    windowStart: undefined,

    value: 50,

    /**
     * @type {array} data Array of data objects.
     * [
     *   {'key': 44, 'value': 343124},
     *   {'key': 123, 'value': 8484},
     *   ...
     * ]
     */
    data: undefined,

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
//console.log("Default change event handler. Key:" + data.key + ", Value:" + strVal);
    },

    /**
     * Default resize event handler.
     *
     * @param {object} event jQuery Event.
     * @param {object} data The widget.
     * @returns {undefined}
     */
    afterResize: function (event, data) {
      let bRedraw = false,
        widget = data.context;

      if (widget._container.height() !== widget._displayHeight) {
        widget._displayHeight = Math.floor(widget._container.height());
        bRedraw = true;
      }

      if (widget._container.width() !== widget._displayWidth) {
        widget._displayWidth = Math.floor(widget._container.width());
        bRedraw = true;
      }

      if (bRedraw) {
        widget._draw();
      }
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
    this._container = $('<div class="timeline"></div>')
    this._container.css({
      width: this.options.width || this._DEFAULT_WIDTH,
      height: this.options.height || this._DEFAULT_HEIGHT
    });

    // window element
    this._window = $('<div class="window"></div>');

    // assemble the elements early so we can get width, height, ...
    this._window.appendTo(this._container);
    this._container.appendTo(this.element);

    this._displayWidth = Math.floor(this._container.width());
    this._displayHeight = Math.floor(this._container.height());

    this._windowStart = 0; // set start so windowSize() doesn't error
    this.windowSize(this.options.widowSize || this._DEFAULT_WINDOW_SIZE);
    this.windowStart(this.options.windowStart || this._DEFAULT_WINDOW_START);

$("#debugConsole").text("px:" + this.windowStart() * this._container.width() + ", %:" + this.windowStart() + ", sz:" + this.windowSize());

    // load data after _displayWidth is set
    if (this.options.data) {
      this.data(this.options.data);
    }

    // setup selection window
    let widget = this;  // ToDO: fix this, isn't there a way to bind scope????????????????????

    $(window).on('resize', function (event) {
      let oldValue = {
        "w": widget._displayWidth,
        "h": widget._displayHeight
      };

      widget._trigger("afterResize", event, {"oldValue": oldValue, "context": widget});
    });

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

    });
  },

  /**
   *
   * @param {string} key Option name.
   * @param {mixed} value New value.
   * @param {mixed} oldValue The previous value of the option.
   * @param {object} context The context the option was changed from, ofter the widget instance.
   * @returns {undefined}
   */
  _setOption: function (key, value, oldValue, context) {
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
    if (!this._displayWidth) {
      throw new Error('Invalid display width');
    }

    if (!this._dataRange) {
      throw new Error('Invalid data range');
    }

    return this._displayWidth / this._dataRange;
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
   * Set the data.
   *
   * @param {array} data Array of data objects.
   * [
   *   {'key': 44, 'value': 343124},
   *   {'key': 123, 'value': 8484},
   *   ...
   * ]
   */
  data: function (data) {
    let i, len, dataMin, dataMax, oItem;

    this._dataMaxDepth = 1;

     if (data === undefined) {
      return this.options.data;
    }

    for (i = 0, len = data.length; i < len; i++) {
      if (dataMin === undefined || this._dataCompare(data[i], dataMin) < 0) {
        dataMin = data[i];
      }

      if (dataMax === undefined || this._dataCompare(data[i], dataMax) > 0) {
        dataMax = data[i];
      }

    }

    if (dataMax === undefined || dataMin === undefined) {
      throw new Error("Invalid data");
    }

    // deep copy/clone the original array. todo: How expensive?
    this._data = data.slice();

    this._data.sort(this._dataCompare);

    // walk data and find items with same key, combine them into a single index
    for (i = 0; i < this._data.length - 1; i +=1) {
      oItem = ($.isArray(this._data[i])) ? this._data[i][0] : this._data[i];
      if (oItem.key === this._data[i + 1].key) {
        if ($.isArray(this._data[i])) {
          this._data[i].push(data[i + 1]);
        } else {
          let tmp = this._data[i];
          this._data[i] = [tmp, this._data[i + 1]];
        }

        if (this._data[i].length > this._dataMaxDepth) {
          this._dataMaxDepth = this._data[i].length;
        }

        this._data.splice(i + 1, 1);
        i--;
      }
    }

    this._dataRange = (dataMax.key - dataMin.key) + 1;
    this._dataOffset = dataMin.key;

    this._draw();

    this._setOption("data", data);
  },

  /**
   * Compare data items.
   *
   * Maybe this could be an option?
   *
   * How to deal with dates? Force user to convert to timestamp?
   *
   * @param {object} a Data object {key:string, value:mixed}
   * @param {object} b Data object {key:string, value:mixed}
   * @returns {Number} Returns -1 if a < b, 0 if equal, 1 if a > b
   */
  _dataCompare: function (a, b) {
    if (a.key === b.key) {
      return 0;
    }
    return (a.key > b.key) ? 1 : -1;
  },

  /**
   * Draw the widget background representing the entire data set.
   *
   * @returns {undefined}
   */
  _draw: function () {
    let i, len, x, y, strCnt;

    $('.timeline').find('svg#dataBg').remove();

    let d3tl = d3.select(".timeline");
    let d3svg = d3tl.append("svg").attr("id", 'dataBg').attr("width", '100%').attr("height", '100%');

    for (i = 0, len = this._data.length; i < len; i += 1) {
      if ($.isArray(this._data[i])) {
        x = this._dataIndexToDisplayIndex(this._data[i][0].key);
        y = ((1 / this._dataMaxDepth) * this._data[i].length) * this._displayHeight;
        strCnt = this._data[i].length.toString();
      } else {
        x = this._dataIndexToDisplayIndex(this._data[i].key);
        y = ((1 / this._dataMaxDepth))  * this._displayHeight;
        strCnt = "1";
      }

      d3svg.append("line")
              .attr("x1", x).attr("y1", this._displayHeight)
              .attr("x2", x).attr("y2", this._displayHeight - y)
              .attr("stroke-width", 2).attr("stroke", "blue")
              .append("title").text(strCnt);
    }
  },

  /**
   * Getter/Setter for value.
   *
   * @ToDo: remove all the 'value' related code
   *
   * @param {integer} value
   * @returns {undefined}
   */
  value: function (value) {
    if (value === undefined) {
      return this.options.value;
    }

    if (value > 100 || value < 0) {
      throw new Error("Invalid value: "  + value);
    }

    this._setOption("value", value);
  },

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

