
//
// Logging/TAP setup
//

//if (typeof require !== 'undefined') {
//  var $ = require('../public_html/vendor/jquery.js');
//  var qunitTap = require('../public_html/vendor/qunit-tap.js');
//}

var Tap = qunitTap(QUnit, function() {
    console.log.apply(console, arguments);
  },
  {
    showSourceOnFailure: false
  }
);

Tap.moduleStart = function(arg) {
  this.note('Module: ' + arg.name); // 'this' refers to tap object
};

QUnit.testStart(function( details ) {
  console.log( "Now running: ", details.module, details.name );
});

//QUnit.testDone( function( details ) {
//  var result = {
//    "Module name": details.module,
//    "Test name": details.name,
//    "Assertions": {
//      "Total": details.total,
//      "Passed": details.passed,
//      "Failed": details.failed
//    },
//    "Skipped": details.skipped,
//    "Todo": details.todo,
//    "Runtime": details.runtime
//  };
//
//  //console.log( JSON.stringify( result, null, 2 ) );
//} );

QUnit.done(function( details ) {
  console.log("Total: ", details.total, " Failed: ", details.failed, " Passed: ", details.passed, " Runtime: ", details.runtime);
});

//
// Tests
//

QUnit.module("BarView", {

  /**
   * Before this module
   *
   * @returns {undefined}
   */
  "before": function () {
    // empty
  },

  /**
   * Before each test
   *
   * @returns {undefined}
   */
  "beforeEach": function () {
    this.fixture = $("#qunit-fixture");
    this.fixture.append('<div id="widgetElement2"></div>');

    this.widgetElement2 = $("#widgetElement2");

    this.widgetElement2.barView({});
    this.myBarView = this.widgetElement2.data("custom-barView");
  },

  /**
   * After each test
   *
   * Notes:
   * - It's not necessary to clean up fixtures/remove added DOM elements, QUnit
   *   does that automatically.
   * - Do we need to call widget.destroy?
   *
   * @returns {undefined}
   */
  "afterEach": function () {
    // empty
  },

  /**
   * After this module
   *
   * @returns {undefined}
   */
  "after": function () {
    // empty
  }
});

/**
 *
 */
QUnit.test("jQuery present", function(assert) {
  assert.ok(typeof $.fn.jquery === "string", 'typeof $.fn.jquery === "string"');
  assert.ok($.fn.jquery === "3.3.1", '$.fn.jquery === "3.3.1"');
});

/**
 *
 */
QUnit.test("QUnit fixture present", function(assert) {
    assert.ok(this.fixture, 'fixture is present');
    assert.ok(this.widgetElement2, 'widgetElement2 is present');
});

/**
 *
 */
QUnit.test("Constructor", function(assert) {
    // were we able to instantiate the object?
    assert.ok(this.myBarView, 'BarView object retrieval from DOM - object exists');

    // Is it an actual barView object?
    assert.ok(this.myBarView.widgetName === 'barView', 'BarView object retrieval from DOM - object has uuid');
});

/**
 *
 */
QUnit.test("Test option cloneData - get", function(assert) {
    // Result should be a bool. 'cloneData' is simple option; when set, the provided
    // data remain unchanged.
    let expected = $.custom.barView.prototype.options.cloneData;
    assert.strictEqual(this.myBarView.option('cloneData'), expected, 'get "cloneData"');
});

QUnit.test("Test option height - get", function(assert) {
    // 'height' should be a CSS value. 'height' is a simple option; when set, the
    // provided data remain unchanged, though when set associated variable
    // (_height + DOM) are changed.
    let expected = $.custom.barView.prototype.options.height;
    assert.strictEqual(this.myBarView.option('height'), expected, 'get "height"');
});

QUnit.test("Test option height - set", function(assert) {
    // 'height' should be a CSS value. 'height' is a simple option; when set, the
    // provided data remain unchanged, though associated variable (_height + DOM) are changed.
    let cssValue, newValue;

    newValue = '64';
    cssValue = newValue + 'px';

    this.myBarView.option('height', cssValue);

    // chk the actual option value
    assert.strictEqual(this.myBarView.options.height, cssValue, "Set option 'height'");

    // chk the cached DOM element height
    assert.equal(this.myBarView._height, newValue, "Option height should set _height");

    // chk the actual DOM element height
    assert.equal(this.myBarView._container.height(), newValue, "Option height should set _container height");
});


