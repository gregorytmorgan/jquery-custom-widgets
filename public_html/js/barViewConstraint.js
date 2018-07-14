/**
 * BarView Widget Constraint
 *
 * Extends the BarView widget to include a selection window.
 */

$.widget("custom.barViewConstraint", $.custom.barView, {

  /**
   * The selection window jquery dom object.
   */
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

  options: {

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

  /**
   *
   * @returns {undefined}
   */
  _create: function () {
    let key;

    // before invoking the parent constructor, merge options that are not present, but
    // don't overwrite any existing options. This is necessary since the child options
    // are process by the parent, who will view the child specific options as invalid
    for (key in this.options) {
      if (this.options.hasOwnProperty(key) && !$.custom.barView.prototype.options.hasOwnProperty(key)) {
        $.custom.barView.prototype.options[key] = this.options.key;
      }
    }

    this._super();

    // window element
    this._window = $('<div class="window"></div>');

    this._window.appendTo(this._container);

    this._windowStart = 0; // set start so windowSize() doesn't error
    this.windowSize(this.options.widowSize || $.custom.barView.prototype.options.windowSize);
    this.windowStart(this.options.windowStart || $.custom.barView.prototype.options.windowStart);

    // setup selection window
    let widget = this;  // ToDO: fix this, isn't there a way to bind scope????????????????????

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
  }, // create

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
