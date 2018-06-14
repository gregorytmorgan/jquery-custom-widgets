/**
 * Custom Timeline Widget
 *
 * @type type
 */
$.widget("custom.timeline", {

  // Default options.
  //
  // Notes:
  // 1) In the case of event handlers, they must be defined here in the options
  // object vs as a regular method for them to be automatically bound.
  options: {
    value: 50,

    /**
     * Default AtStart handler
     *
     * @param {type} event
     * @param {type} data
     * @returns {undefined}
     */
    change: function (event, data) {
      console.log("Default change handler");
    },

    /**
     *
     * @param {type} event
     * @param {type} data
     * @returns {undefined}
     */
    atstart: function (event, data) {
      console.log('Default handler for custom event atStart event');
    },

    /**
     *
     * @param {type} event
     * @param {type} data
     * @returns {undefined}
     */
    atend: function (event, data) {
      console.log('Default handler for custom event atEnd event');
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

    this.element.addClass("timeline");

    // chart container
    this._container = $('<div class="timeline-container"></div>').appendTo(this.element);

    this.element.text("Initializing ...");
  },

  /**
   *
   * @param {string} key Option name.
   * @param {mixed} value New value.
   * @returns {undefined}
   * @throws Exception
   */
  _setOption: function (key, value) {
    this._super(key, value);

    // do we need to manually trigger a change event?
    this._trigger("change", null, {key: key, value: value});
  },

  /**
   *
   * @returns {undefined}
   */
  _setOptions: function (options) {
    this._super(options);
  },

  /**
   *
   * @returns {undefined}
   */
  _destroy: function() {
    this.element.removeClass("timeline").text("");
  },

  /*
   * Public methods
   *
   */

  /**
   * Getter/Setter for value.
   *
   * @param {integer} value
   * @returns {Number}
   */
  value: function (value) {
    if (value === undefined) {
      return this.options.value;
    }

    if (value > 100 || value < 0) {
      throw new Error("Invalid value: "  + value);
    }

    this._setOption("value", value)
    this.element.text(this.options.value + "%");
  }
});

/*
 * On load handler
 *
 * @returns {undefined}
 */
window.onload = function () {
  console.log("OnLoad");
};

/*
 * Document ready handler
 *
 * @type type
 */
$(document).ready(function () {
  console.log("documentReady");

  // alternate widget initialization syntax
  // var bar = $.custom.progressbar({}, $("<div></div>").appendTo("body"));

  // create the dom element that is the root of the widget. Could just use the
  // container itself?
//        let tlElement = $("<div></div>");
//
//        // construct a timeline widget in the container2 element. We pass
//        // in two custom handlers for the atstart' and 'atend' custom events
//        tlElement.appendTo("#container2").timeline({
//          // override the widgets default initial value.
//          value: 20,
//
//          // override the widgets default handler for the custom atstart event
//          atstart: function (event, data) {
//            console.log('Custom event atStart handler defined at initialization.');
//          }
//        });


  let con = $("#container2");
  con.timeline({
    // override the widgets default initial value.
    value: 20,

    // override the widgets default handler for the custom atstart event
    atstart: function (event, data) {
      console.log('Custom event atStart handler defined at initialization.');
    }
  });

return;

  // Hack way to call method, by calling object and passing in func name
  console.log("Initial value: " + tlElement.timeline("value"));

  // Alternate way of calling widget methods
  let myTimeline = tlElement.data("custom-timeline");
  myTimeline.value(25);
  console.log("Set the value to 25. Value: " + myTimeline.value());

  // Notes:
  // 1) custom handlers are called before the default.
  // 2) Returning false or using stopImmediatePropagation(), stopPropagation()
  // and preventDefault() does not seem to stop the default handler from firing?
  // 3) Note the closure. the hander doesn't have a widget context?
  tlElement.bind("timelinechange", function (event, data) {
    console.log("Custom change handler. Value is " + data.value);

    if (data.value === 0) {
      myTimeline._trigger("atstart", null, {value: 0});
    } else if (data.value === 100) {
      myTimeline._trigger("atend", null, {value: 100});
    }
  });

  myTimeline.value(0);
  console.log("Set the value to 0. Value: " + myTimeline.value());

  myTimeline.value(100);
  console.log("Set the value to 100. Value: " + myTimeline.value());
});

