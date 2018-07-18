
//
// Logging/TAP setup
//

/* globals QUnit */

let Tap = qunitTap(QUnit, function() {
    console.log.apply(console, arguments);
  },
  {
    showSourceOnFailure: false
  }
);

Tap.moduleStart = function(arg) {
  this.note('Module: ' + arg.name); // 'this' refers to tap object
};

//QUnit.testStart(function( details ) {
//  console.log( "Now running: ", details.module, details.name );
//});

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

//
// Tests for basic requirements
//

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
    assert.strictEqual(this.myBarView.widgetName, 'barView', 'BarView object retrieval from DOM - object has uuid');
});

//
// Tests for general option functionality
//

/**
 *
 */
QUnit.test("Test invalid options", function(assert) {
    let option_name = 'foo';

    assert.throws(
      function () {
        this.myBarView.option(option_name);
      },
      new Error("Invalid option " + option_name),
      "Getting an invalid option should throw an exception"
    );

    assert.throws(
      function () {
        this.myBarView.option(option_name, "bar");
      },
      new Error("Invalid option " + option_name),
      "Setting an invalid option should throw an exception"
    );
});

/**
 * Helper function. Dynamically generate a custom test function for each option
 * tested. Used by the "Test option change events" test.
 *
 * @param {mixed} newValue The new option setting.
 * @param {mixed} oldValue The current option setting.
 * @param {object} assert Qunit assert
 * @returns {Function}
 */
function createChangeHandler(newValue, oldValue, assert) {
  return function (event, data) {
    if (jQuery.inArray(data.key, ["change", "afterResize"]) !== -1) {
      assert.ok(true, data.key + ': skipped function compare');
    } else {
      assert.deepEqual(data.value, newValue, data.key + ': data.value === newValue');
      assert.deepEqual(data.oldValue, oldValue, data.key + ': data.oldValue === oldValue');
    }
  };
};

/*
 * For each non function option verify a change event is triggered and the event
 * contains correct new/old values.
 */
QUnit.test("Test option change events", function(assert) {
  let newValue, oldValue;

  // option cloneData change
  oldValue = $.custom.barView.prototype.options.cloneData;
  newValue = !oldValue;
  this.myBarView.option('change', createChangeHandler(newValue, oldValue, assert));
  this.myBarView.option('cloneData', newValue);

  // option width change
  oldValue = $.custom.barView.prototype.options.width;
  newValue = '97%';
  this.myBarView.option('change', createChangeHandler(newValue, oldValue, assert));
  this.myBarView.option('width', newValue);

  // option height change
  oldValue = $.custom.barView.prototype.options.height;
  newValue = '200px';
  this.myBarView.option('change', createChangeHandler(newValue, oldValue, assert));
  this.myBarView.option('height', newValue);

  // option data change
  oldValue = $.custom.barView.prototype.options.data;
  newValue = [
    {'key':0, 'value': 0},
    {'key':1, 'value': 1}
  ];
  this.myBarView.option('change', createChangeHandler(newValue, oldValue, assert));
  this.myBarView.option('data', newValue);
});

/**
 * Option event handler - check context/scope.
 */
QUnit.test("Test event handler context", function(assert) {
  var expectedWidgetName = this.myBarView.widgetName;
  this.myBarView.option('change', function (event, data)  {
    assert.strictEqual(this.widgetName, expectedWidgetName, "Custom callback context should be the widget");
  });
});

//
// Test option behavior specific to each option
//

/**
 * Option cloneData - get, Result should be a bool.
 */
QUnit.test("Test option cloneData - get", function(assert) {
  let expected = $.custom.barView.prototype.options.cloneData;
  assert.strictEqual(this.myBarView.option('cloneData'), expected, 'get "cloneData"');
});

/**
 * Option cloneData - set,"false" and "0" should result in a setting of false.
 */
QUnit.test("Test option cloneData - set", function(assert) {
  let expected = !$.custom.barView.prototype.options.cloneData;

  this.myBarView.option('cloneData', expected);
  assert.strictEqual(this.myBarView.option('cloneData'), expected, 'Set cloneData');

  this.myBarView.option('cloneData', "false");
  assert.strictEqual(this.myBarView.option('cloneData'), false, 'Set cloneData to "false"');

  this.myBarView.option('cloneData', "0");
  assert.strictEqual(this.myBarView.option('cloneData'), false, 'Set cloneData to "0"');
});

/**
 * Option width - get, Result should be a CSS string.
 */
QUnit.test("Test option width - get", function(assert) {
  let expected = $.custom.barView.prototype.options.width;
  assert.strictEqual(this.myBarView.option('width'), expected, 'get "width"');
});

/**
 * Option width - set, additionally changes DOM and widget._width.
 */
QUnit.test("Test option width - set", function(assert) {
  let cssValue, svgElement2,
    newValue = 600, // 600px
    svgElement1 = this.myBarView._container.find('svg.dataBg');

  cssValue = newValue + 'px';

  // need data to actually redraw, otherwise redraw skipped/svg so id doesn't change
  this.myBarView.option('data', [{'key':0, 'value': 0}]);

  this.myBarView.option('width', cssValue);

  // chk the actual option value
  assert.strictEqual(this.myBarView.options.width, cssValue, "Set option 'width'");

  // chk the cached DOM element width
  assert.strictEqual(this.myBarView._width, newValue, "Option width should set widget._width");

  // chk the actual DOM element width
  assert.strictEqual(this.myBarView._container.width(), newValue, "Option width should set widget._container width");

  // the svg element id should change
  svgElement2 = this.myBarView._container.find('svg.dataBg');
  assert.notStrictEqual(svgElement1.attr('id'), svgElement2.attr('id'), "Option width should trigger a redraw");
});

/**
 * Option height - get, Result should be a CSS string.
 */
QUnit.test("Test option height - get", function(assert) {
    let expected = $.custom.barView.prototype.options.height;
    assert.strictEqual(this.myBarView.option('height'), expected, 'get "height"');
});

/**
 * Option height - set, additionally changes DOM and widget._height.
 */
QUnit.test("Test option height - set", function(assert) {
  let cssValue, svgElement2,
    newValue = 64, // 64px
    svgElement1 = this.myBarView._container.find('svg.dataBg');

  cssValue = newValue + 'px';

  // need data to actually redraw, otherwise redraw skipped/svg so id doesn't change
  this.myBarView.option('data', [{'key':0, 'value': 0}]);

  this.myBarView.option('height', cssValue);

  // chk the actual option value
  assert.strictEqual(this.myBarView.options.height, cssValue, "Set option 'height'");

  // chk the cached DOM element height
  assert.strictEqual(this.myBarView._height, newValue, "Option height should set widget._height");

  // chk the actual DOM element height
  assert.strictEqual(this.myBarView._container.height(), newValue, "Option height should set widget._container height");

  // the svg element id should change
  svgElement2 = this.myBarView._container.find('svg.dataBg');
  assert.notStrictEqual(svgElement1.attr('id'), svgElement2.attr('id'), "Set data should trigger a redraw");
});

/**
 *
 */
QUnit.test("Test option data - set", function(assert) {
  let testData0 = [];

  let testData3 = [
    {'key':0, 'value': 0},
    {'key':1, 'value': 1},
    {'key':1, 'value': 2}
  ];

  // key 1 is aggregated
  let testData3Expected = [
    {'key':0, 'value': 0},
    [
      {'key':1, 'value': 1},
      {'key':1, 'value': 2}
    ]
  ];

  // get the svg id before set data
  let svgElementPre = this.myBarView._container.find('svg.dataBg');

  // copy testData3 before calling set data
  let preTestData3 = JSON.stringify(testData3);

  // prevent update of orignal data
  this.myBarView.option('cloneData', true);

  this.myBarView.option('data', testData3);

  // chk if the original testData was changed
  assert.strictEqual(preTestData3, JSON.stringify(testData3), "Set data should NOT mutate input data if cloneData is true");

  // testData3 should now have aggregated keys
  assert.deepEqual(this.myBarView.options.data, testData3Expected, "Set data should aggregate like keys");

  // the svg element id should have changed
  let svgElementPost = this.myBarView._container.find('svg.dataBg');
  assert.notStrictEqual(svgElementPre.attr('id'), svgElementPost.attr('id'), "Set data should trigger a redraw");

  svgElementPre = this.myBarView._container.find('svg.dataBg');
  this.myBarView.option('data', testData0);
  svgElementPost = this.myBarView._container.find('svg.dataBg');
  assert.notStrictEqual(svgElementPre.attr('id'), svgElementPost.attr('id'), "Set data to [] should clear/trigger a redraw");
});

/**
 *
 */
QUnit.test("Test find", function(assert) {

  // key 1 is aggregated
  let result,
    testData = [
      {'key':0, 'value': 0},
      [
        {'key':1, 'value': 1},
        {'key':1, 'value': 2}
      ],
      {'key':3, 'value': 3}
    ];

  result = this.myBarView._find(0, []);
  assert.strictEqual(result, -1, "Find on an empty arrays returns 'not found'");

  result = this.myBarView._find(42, testData);
  assert.strictEqual(result, -1, "Find on non existant key returns 'not found'");

  result = this.myBarView._find(0, testData);
  assert.strictEqual(result, 0, "Finding an existant item at index 0 returns 'found'");

  result = this.myBarView._find(1, testData);
  assert.strictEqual(result, 1, "Finding an existant item at index n returns 'found'");

  result = this.myBarView._find(3, testData);
  assert.strictEqual(result, 2, "Finding an existant item at last index returns 'found'");
});

// end file