/*
    AMD-compatible async 'define' modularization.

    Contains only the 'define' module syntax compatible with the official API
    and a flexible dependency resolver with no restrictions on how you load your files.

    This implementation doesn't load your JS files so you have to do it. You can bundle
    one big file, load multiple files, load them asynchronously, out of order, your call.

    (doesn't include the 'require' and 'requirejs' objects)

    Usage:
        define(name, dependencies, factory)
        define(dependencies, factory)
        define(factory)

        where
            name - a string with your module name
            dependencies - an array listing your dependencies names
            factory - a function that receives your dependencies and returns the module result


    Advantages:

    - Very small (~250 bytes) so you can inline it on every page.
    - Don't expect your modules to be loaded in a specific order.
    - Allows asynchronous loading of your files for maximum performance.
    - Very simple.
    
 */
(function() {
    // object with all executes modules (module_name => module_value)
    var modules = {}; 

    // (dependency_name => [modules])
    var define_queue = {};

    // the 'define' function
    function _define(/* reexecuting?, name, dependencies, factory */) {
        var 
            // extract arguments
            argv = arguments,
            argc = argv.length,

            // extract arguments from function call - (name?, modules?, factory)
            name = argv[argc - 3],
            dependencies = argv[argc - 2] || [],
            factory = argv[argc - 1],

            // helper variables
            params = [],
            dependencies_satisfied = true,
            dependency_name,
            i = 0;

        // find params
        for (; i < dependencies.length; i++) {
            dependency_name = dependencies[i];

            // if this dependency exists, push it to param injection
            if (modules.hasOwnProperty(dependency_name)) {
                params.push(modules[dependency_name]);
            } else {
                if (argc != 4) { // if 4 values, is reexecuting
                    // no module found. save these arguments for future execution.
                    define_queue[dependency_name] = define_queue[dependency_name] || [];
                    define_queue[dependency_name].push([0, name, dependencies, factory]);
                }

                dependencies_satisfied = false;
            }
        }

        // all dependencies are satisfied, so proceed
        if (dependencies_satisfied) {

            // execute this module
            modules[name] = factory.apply(this, params);

            // execute others waiting for this module
            while (define_queue[name] && (argv = define_queue[name].pop())) {
                _define.apply(this, argv);
            }
        }
    }

    // register this as AMD compatible (optional)
    _define.amd = { jQuery: true };

    // exports the define function in global scope
    define = _define;
})();
/*! Hammer.JS - v1.0.6 - 2014-01-02
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
  'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
  return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
  // add styles and attributes to the element to prevent the browser from doing
  // its native behavior. this doesnt prevent the scrolling, but cancels
  // the contextmenu, tap highlighting etc
  // set to false to disable this
  stop_browser_behavior: {
    // this also triggers onselectstart=false for IE
    userSelect       : 'none',
    // this makes the element blocking in IE10 >, you could experiment with the value
    // see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
    touchAction      : 'none',
    touchCallout     : 'none',
    contentZooming   : 'none',
    userDrag         : 'none',
    tapHighlightColor: 'rgba(0,0,0,0)'
  }

  //
  // more settings are defined per gesture at gestures.js
  //
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android|silk/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && window.navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = window.document;

// plugins and gestures namespaces
Hammer.plugins = Hammer.plugins || {};
Hammer.gestures = Hammer.gestures || {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
  if(Hammer.READY) {
    return;
  }

  // find what eventtypes we add listeners to
  Hammer.event.determineEventTypes();

  // Register all gestures inside Hammer.gestures
  Hammer.utils.each(Hammer.gestures, function(gesture){
    Hammer.detection.register(gesture);
  });

  // Add touch events on the document
  Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
  Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

  // Hammer is ready...!
  Hammer.READY = true;
}

Hammer.utils = {
  /**
   * extend method,
   * also used for cloning when dest is an empty object
   * @param   {Object}    dest
   * @param   {Object}    src
   * @parm  {Boolean}  merge    do a merge
   * @returns {Object}    dest
   */
  extend: function extend(dest, src, merge) {
    for(var key in src) {
      if(dest[key] !== undefined && merge) {
        continue;
      }
      dest[key] = src[key];
    }
    return dest;
  },


  /**
   * for each
   * @param obj
   * @param iterator
   */
  each: function(obj, iterator, context) {
    var i, length;
    // native forEach on arrays
    if ('forEach' in obj) {
      obj.forEach(iterator, context);
    }
    // arrays
    else if(obj.length !== undefined) {
      for (i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === false) {
          return;
        }
      }
    }
    // objects
    else {
      for (i in obj) {
        if (obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj) === false) {
          return;
        }
      }
    }
  },

  /**
   * find if a node is in the given parent
   * used for event delegation tricks
   * @param   {HTMLElement}   node
   * @param   {HTMLElement}   parent
   * @returns {boolean}       has_parent
   */
  hasParent: function(node, parent) {
    while(node) {
      if(node == parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  },


  /**
   * get the center of all the touches
   * @param   {Array}     touches
   * @returns {Object}    center
   */
  getCenter: function getCenter(touches) {
    var valuesX = [], valuesY = [];

    Hammer.utils.each(touches, function(touch) {
      // I prefer clientX because it ignore the scrolling position
      valuesX.push(typeof touch.clientX !== 'undefined' ? touch.clientX : touch.pageX );
      valuesY.push(typeof touch.clientY !== 'undefined' ? touch.clientY : touch.pageY );
    });

    return {
      pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
      pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
    };
  },


  /**
   * calculate the velocity between two points
   * @param   {Number}    delta_time
   * @param   {Number}    delta_x
   * @param   {Number}    delta_y
   * @returns {Object}    velocity
   */
  getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
    return {
      x: Math.abs(delta_x / delta_time) || 0,
      y: Math.abs(delta_y / delta_time) || 0
    };
  },


  /**
   * calculate the angle between two coordinates
   * @param   {Touch}     touch1
   * @param   {Touch}     touch2
   * @returns {Number}    angle
   */
  getAngle: function getAngle(touch1, touch2) {
    var y = touch2.pageY - touch1.pageY,
      x = touch2.pageX - touch1.pageX;
    return Math.atan2(y, x) * 180 / Math.PI;
  },


  /**
   * angle to direction define
   * @param   {Touch}     touch1
   * @param   {Touch}     touch2
   * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
   */
  getDirection: function getDirection(touch1, touch2) {
    var x = Math.abs(touch1.pageX - touch2.pageX),
      y = Math.abs(touch1.pageY - touch2.pageY);

    if(x >= y) {
      return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
    }
    else {
      return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
    }
  },


  /**
   * calculate the distance between two touches
   * @param   {Touch}     touch1
   * @param   {Touch}     touch2
   * @returns {Number}    distance
   */
  getDistance: function getDistance(touch1, touch2) {
    var x = touch2.pageX - touch1.pageX,
      y = touch2.pageY - touch1.pageY;
    return Math.sqrt((x * x) + (y * y));
  },


  /**
   * calculate the scale factor between two touchLists (fingers)
   * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
   * @param   {Array}     start
   * @param   {Array}     end
   * @returns {Number}    scale
   */
  getScale: function getScale(start, end) {
    // need two fingers...
    if(start.length >= 2 && end.length >= 2) {
      return this.getDistance(end[0], end[1]) /
        this.getDistance(start[0], start[1]);
    }
    return 1;
  },


  /**
   * calculate the rotation degrees between two touchLists (fingers)
   * @param   {Array}     start
   * @param   {Array}     end
   * @returns {Number}    rotation
   */
  getRotation: function getRotation(start, end) {
    // need two fingers
    if(start.length >= 2 && end.length >= 2) {
      return this.getAngle(end[1], end[0]) -
        this.getAngle(start[1], start[0]);
    }
    return 0;
  },


  /**
   * boolean if the direction is vertical
   * @param    {String}    direction
   * @returns  {Boolean}   is_vertical
   */
  isVertical: function isVertical(direction) {
    return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
  },


  /**
   * stop browser default behavior with css props
   * @param   {HtmlElement}   element
   * @param   {Object}        css_props
   */
  stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
    if(!css_props || !element || !element.style) {
      return;
    }

    // with css properties for modern browsers
    Hammer.utils.each(['webkit', 'khtml', 'moz', 'Moz', 'ms', 'o', ''], function(vendor) {
      Hammer.utils.each(css_props, function(prop) {
          // vender prefix at the property
          if(vendor) {
            prop = vendor + prop.substring(0, 1).toUpperCase() + prop.substring(1);
          }
          // set the style
          if(prop in element.style) {
            element.style[prop] = prop;
          }
      });
    });

    // also the disable onselectstart
    if(css_props.userSelect == 'none') {
      element.onselectstart = function() {
        return false;
      };
    }

    // and disable ondragstart
    if(css_props.userDrag == 'none') {
      element.ondragstart = function() {
        return false;
      };
    }
  }
};


/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
  var self = this;

  // setup HammerJS window events and register all gestures
  // this also sets up the default options
  setup();

  this.element = element;

  // start/stop detection option
  this.enabled = true;

  // merge options
  this.options = Hammer.utils.extend(
    Hammer.utils.extend({}, Hammer.defaults),
    options || {});

  // add some css to the element to prevent the browser from doing its native behavoir
  if(this.options.stop_browser_behavior) {
    Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
  }

  // start detection on touchstart
  Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
    if(self.enabled) {
      Hammer.detection.startDetect(self, ev);
    }
  });

  // return instance
  return this;
};


Hammer.Instance.prototype = {
  /**
   * bind events to the instance
   * @param   {String}      gesture
   * @param   {Function}    handler
   * @returns {Hammer.Instance}
   */
  on: function onEvent(gesture, handler) {
    var gestures = gesture.split(' ');
    Hammer.utils.each(gestures, function(gesture) {
      this.element.addEventListener(gesture, handler, false);
    }, this);
    return this;
  },


  /**
   * unbind events to the instance
   * @param   {String}      gesture
   * @param   {Function}    handler
   * @returns {Hammer.Instance}
   */
  off: function offEvent(gesture, handler) {
    var gestures = gesture.split(' ');
    Hammer.utils.each(gestures, function(gesture) {
      this.element.removeEventListener(gesture, handler, false);
    }, this);
    return this;
  },


  /**
   * trigger gesture event
   * @param   {String}      gesture
   * @param   {Object}      [eventData]
   * @returns {Hammer.Instance}
   */
  trigger: function triggerEvent(gesture, eventData) {
    // optional
    if(!eventData) {
      eventData = {};
    }

    // create DOM event
    var event = Hammer.DOCUMENT.createEvent('Event');
    event.initEvent(gesture, true, true);
    event.gesture = eventData;

    // trigger on the target if it is in the instance element,
    // this is for event delegation tricks
    var element = this.element;
    if(Hammer.utils.hasParent(eventData.target, element)) {
      element = eventData.target;
    }

    element.dispatchEvent(event);
    return this;
  },


  /**
   * enable of disable hammer.js detection
   * @param   {Boolean}   state
   * @returns {Hammer.Instance}
   */
  enable: function enable(state) {
    this.enabled = state;
    return this;
  }
};


/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
  /**
   * simple addEventListener
   * @param   {HTMLElement}   element
   * @param   {String}        type
   * @param   {Function}      handler
   */
  bindDom: function(element, type, handler) {
    var types = type.split(' ');
    Hammer.utils.each(types, function(type){
      element.addEventListener(type, handler, false);
    });
  },


  /**
   * touch events with mouse fallback
   * @param   {HTMLElement}   element
   * @param   {String}        eventType        like Hammer.EVENT_MOVE
   * @param   {Function}      handler
   */
  onTouch: function onTouch(element, eventType, handler) {
    var self = this;

    this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
      var sourceEventType = ev.type.toLowerCase();

      // onmouseup, but when touchend has been fired we do nothing.
      // this is for touchdevices which also fire a mouseup on touchend
      if(sourceEventType.match(/mouse/) && touch_triggered) {
        return;
      }

      // mousebutton must be down or a touch event
      else if(sourceEventType.match(/touch/) ||   // touch events are always on screen
        sourceEventType.match(/pointerdown/) || // pointerevents touch
        (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
        ) {
        enable_detect = true;
      }

      // mouse isn't pressed
      else if(sourceEventType.match(/mouse/) && !ev.which) {
        enable_detect = false;
      }


      // we are in a touch event, set the touch triggered bool to true,
      // this for the conflicts that may occur on ios and android
      if(sourceEventType.match(/touch|pointer/)) {
        touch_triggered = true;
      }

      // count the total touches on the screen
      var count_touches = 0;

      // when touch has been triggered in this detection session
      // and we are now handling a mouse event, we stop that to prevent conflicts
      if(enable_detect) {
        // update pointerevent
        if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
          count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
        }
        // touch
        else if(sourceEventType.match(/touch/)) {
          count_touches = ev.touches.length;
        }
        // mouse
        else if(!touch_triggered) {
          count_touches = sourceEventType.match(/up/) ? 0 : 1;
        }

        // if we are in a end event, but when we remove one touch and
        // we still have enough, set eventType to move
        if(count_touches > 0 && eventType == Hammer.EVENT_END) {
          eventType = Hammer.EVENT_MOVE;
        }
        // no touches, force the end event
        else if(!count_touches) {
          eventType = Hammer.EVENT_END;
        }

        // store the last move event
        if(count_touches || last_move_event === null) {
          last_move_event = ev;
        }

        // trigger the handler
        handler.call(Hammer.detection, self.collectEventData(element, eventType, self.getTouchList(last_move_event, eventType), ev));

        // remove pointerevent from list
        if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
          count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
        }
      }

      // on the end we reset everything
      if(!count_touches) {
        last_move_event = null;
        enable_detect = false;
        touch_triggered = false;
        Hammer.PointerEvent.reset();
      }
    });
  },


  /**
   * we have different events for each device/browser
   * determine what we need and set them in the Hammer.EVENT_TYPES constant
   */
  determineEventTypes: function determineEventTypes() {
    // determine the eventtype we want to set
    var types;

    // pointerEvents magic
    if(Hammer.HAS_POINTEREVENTS) {
      types = Hammer.PointerEvent.getEvents();
    }
    // on Android, iOS, blackberry, windows mobile we dont want any mouseevents
    else if(Hammer.NO_MOUSEEVENTS) {
      types = [
        'touchstart',
        'touchmove',
        'touchend touchcancel'];
    }
    // for non pointer events browsers and mixed browsers,
    // like chrome on windows8 touch laptop
    else {
      types = [
        'touchstart mousedown',
        'touchmove mousemove',
        'touchend touchcancel mouseup'];
    }

    Hammer.EVENT_TYPES[Hammer.EVENT_START] = types[0];
    Hammer.EVENT_TYPES[Hammer.EVENT_MOVE] = types[1];
    Hammer.EVENT_TYPES[Hammer.EVENT_END] = types[2];
  },


  /**
   * create touchlist depending on the event
   * @param   {Object}    ev
   * @param   {String}    eventType   used by the fakemultitouch plugin
   */
  getTouchList: function getTouchList(ev/*, eventType*/) {
    // get the fake pointerEvent touchlist
    if(Hammer.HAS_POINTEREVENTS) {
      return Hammer.PointerEvent.getTouchList();
    }
    // get the touchlist
    else if(ev.touches) {
      return ev.touches;
    }
    // make fake touchlist from mouse position
    else {
      ev.identifier = 1;
      return [ev];
    }
  },


  /**
   * collect event data for Hammer js
   * @param   {HTMLElement}   element
   * @param   {String}        eventType        like Hammer.EVENT_MOVE
   * @param   {Object}        eventData
   */
  collectEventData: function collectEventData(element, eventType, touches, ev) {
    // find out pointerType
    var pointerType = Hammer.POINTER_TOUCH;
    if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
      pointerType = Hammer.POINTER_MOUSE;
    }

    return {
      center     : Hammer.utils.getCenter(touches),
      timeStamp  : new Date().getTime(),
      target     : ev.target,
      touches    : touches,
      eventType  : eventType,
      pointerType: pointerType,
      srcEvent   : ev,

      /**
       * prevent the browser default actions
       * mostly used to disable scrolling of the browser
       */
      preventDefault: function() {
        if(this.srcEvent.preventManipulation) {
          this.srcEvent.preventManipulation();
        }

        if(this.srcEvent.preventDefault) {
          this.srcEvent.preventDefault();
        }
      },

      /**
       * stop bubbling the event up to its parents
       */
      stopPropagation: function() {
        this.srcEvent.stopPropagation();
      },

      /**
       * immediately stop gesture detection
       * might be useful after a swipe was detected
       * @return {*}
       */
      stopDetect: function() {
        return Hammer.detection.stopDetect();
      }
    };
  }
};

Hammer.PointerEvent = {
  /**
   * holds all pointers
   * @type {Object}
   */
  pointers: {},

  /**
   * get a list of pointers
   * @returns {Array}     touchlist
   */
  getTouchList: function() {
    var self = this;
    var touchlist = [];

    // we can use forEach since pointerEvents only is in IE10
    Hammer.utils.each(self.pointers, function(pointer){
      touchlist.push(pointer);
    });
    
    return touchlist;
  },

  /**
   * update the position of a pointer
   * @param   {String}   type             Hammer.EVENT_END
   * @param   {Object}   pointerEvent
   */
  updatePointer: function(type, pointerEvent) {
    if(type == Hammer.EVENT_END) {
      this.pointers = {};
    }
    else {
      pointerEvent.identifier = pointerEvent.pointerId;
      this.pointers[pointerEvent.pointerId] = pointerEvent;
    }

    return Object.keys(this.pointers).length;
  },

  /**
   * check if ev matches pointertype
   * @param   {String}        pointerType     Hammer.POINTER_MOUSE
   * @param   {PointerEvent}  ev
   */
  matchType: function(pointerType, ev) {
    if(!ev.pointerType) {
      return false;
    }

    var pt = ev.pointerType,
      types = {};
    types[Hammer.POINTER_MOUSE] = (pt === ev.MSPOINTER_TYPE_MOUSE || pt === Hammer.POINTER_MOUSE);
    types[Hammer.POINTER_TOUCH] = (pt === ev.MSPOINTER_TYPE_TOUCH || pt === Hammer.POINTER_TOUCH);
    types[Hammer.POINTER_PEN] = (pt === ev.MSPOINTER_TYPE_PEN || pt === Hammer.POINTER_PEN);
    return types[pointerType];
  },


  /**
   * get events
   */
  getEvents: function() {
    return [
      'pointerdown MSPointerDown',
      'pointermove MSPointerMove',
      'pointerup pointercancel MSPointerUp MSPointerCancel'
    ];
  },

  /**
   * reset the list
   */
  reset: function() {
    this.pointers = {};
  }
};


Hammer.detection = {
  // contains all registred Hammer.gestures in the correct order
  gestures: [],

  // data of the current Hammer.gesture detection session
  current : null,

  // the previous Hammer.gesture session data
  // is a full clone of the previous gesture.current object
  previous: null,

  // when this becomes true, no gestures are fired
  stopped : false,


  /**
   * start Hammer.gesture detection
   * @param   {Hammer.Instance}   inst
   * @param   {Object}            eventData
   */
  startDetect: function startDetect(inst, eventData) {
    // already busy with a Hammer.gesture detection on an element
    if(this.current) {
      return;
    }

    this.stopped = false;

    this.current = {
      inst      : inst, // reference to HammerInstance we're working for
      startEvent: Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
      lastEvent : false, // last eventData
      name      : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
    };

    this.detect(eventData);
  },


  /**
   * Hammer.gesture detection
   * @param   {Object}    eventData
   */
  detect: function detect(eventData) {
    if(!this.current || this.stopped) {
      return;
    }

    // extend event data with calculations about scale, distance etc
    eventData = this.extendEventData(eventData);

    // instance options
    var inst_options = this.current.inst.options;

    // call Hammer.gesture handlers
    Hammer.utils.each(this.gestures, function(gesture) {
      // only when the instance options have enabled this gesture
      if(!this.stopped && inst_options[gesture.name] !== false) {
        // if a handler returns false, we stop with the detection
        if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
          this.stopDetect();
          return false;
        }
      }
    }, this);

    // store as previous event event
    if(this.current) {
      this.current.lastEvent = eventData;
    }

    // endevent, but not the last touch, so dont stop
    if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length - 1) {
      this.stopDetect();
    }

    return eventData;
  },


  /**
   * clear the Hammer.gesture vars
   * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
   * to stop other Hammer.gestures from being fired
   */
  stopDetect: function stopDetect() {
    // clone current data to the store as the previous gesture
    // used for the double tap gesture, since this is an other gesture detect session
    this.previous = Hammer.utils.extend({}, this.current);

    // reset the current
    this.current = null;

    // stopped!
    this.stopped = true;
  },


  /**
   * extend eventData for Hammer.gestures
   * @param   {Object}   ev
   * @returns {Object}   ev
   */
  extendEventData: function extendEventData(ev) {
    var startEv = this.current.startEvent;

    // if the touches change, set the new touches over the startEvent touches
    // this because touchevents don't have all the touches on touchstart, or the
    // user must place his fingers at the EXACT same time on the screen, which is not realistic
    // but, sometimes it happens that both fingers are touching at the EXACT same time
    if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
      // extend 1 level deep to get the touchlist with the touch objects
      startEv.touches = [];
      Hammer.utils.each(ev.touches, function(touch) {
        startEv.touches.push(Hammer.utils.extend({}, touch));
      });
    }

    var delta_time = ev.timeStamp - startEv.timeStamp
      , delta_x = ev.center.pageX - startEv.center.pageX
      , delta_y = ev.center.pageY - startEv.center.pageY
      , velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y)
      , interimAngle
      , interimDirection;

    // end events (e.g. dragend) don't have useful values for interimDirection & interimAngle
    // because the previous event has exactly the same coordinates
    // so for end events, take the previous values of interimDirection & interimAngle
    // instead of recalculating them and getting a spurious '0'
    if(ev.eventType === 'end') {
      interimAngle = this.current.lastEvent && this.current.lastEvent.interimAngle;
      interimDirection = this.current.lastEvent && this.current.lastEvent.interimDirection;
    }
    else {
      interimAngle = this.current.lastEvent && Hammer.utils.getAngle(this.current.lastEvent.center, ev.center);
      interimDirection = this.current.lastEvent && Hammer.utils.getDirection(this.current.lastEvent.center, ev.center);
    }

    Hammer.utils.extend(ev, {
      deltaTime: delta_time,

      deltaX: delta_x,
      deltaY: delta_y,

      velocityX: velocity.x,
      velocityY: velocity.y,

      distance: Hammer.utils.getDistance(startEv.center, ev.center),

      angle: Hammer.utils.getAngle(startEv.center, ev.center),
      interimAngle: interimAngle,

      direction: Hammer.utils.getDirection(startEv.center, ev.center),
      interimDirection: interimDirection,

      scale: Hammer.utils.getScale(startEv.touches, ev.touches),
      rotation: Hammer.utils.getRotation(startEv.touches, ev.touches),

      startEvent: startEv
    });

    return ev;
  },


  /**
   * register new gesture
   * @param   {Object}    gesture object, see gestures.js for documentation
   * @returns {Array}     gestures
   */
  register: function register(gesture) {
    // add an enable gesture options if there is no given
    var options = gesture.defaults || {};
    if(options[gesture.name] === undefined) {
      options[gesture.name] = true;
    }

    // extend Hammer default options with the Hammer.gesture options
    Hammer.utils.extend(Hammer.defaults, options, true);

    // set its index
    gesture.index = gesture.index || 1000;

    // add Hammer.gesture to the list
    this.gestures.push(gesture);

    // sort the list by index
    this.gestures.sort(function(a, b) {
      if(a.index < b.index) { return -1; }
      if(a.index > b.index) { return 1; }
      return 0;
    });

    return this.gestures;
  }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
  name     : 'drag',
  index    : 50,
  defaults : {
    drag_min_distance            : 10,
    
    // Set correct_for_drag_min_distance to true to make the starting point of the drag
    // be calculated from where the drag was triggered, not from where the touch started.
    // Useful to avoid a jerk-starting drag, which can make fine-adjustments
    // through dragging difficult, and be visually unappealing.
    correct_for_drag_min_distance: true,
    
    // set 0 for unlimited, but this can conflict with transform
    drag_max_touches             : 1,
    
    // prevent default browser behavior when dragging occurs
    // be careful with it, it makes the element a blocking element
    // when you are using the drag gesture, it is a good practice to set this true
    drag_block_horizontal        : false,
    drag_block_vertical          : false,
    
    // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
    // It disallows vertical directions if the initial direction was horizontal, and vice versa.
    drag_lock_to_axis            : false,
    
    // drag lock only kicks in when distance > drag_lock_min_distance
    // This way, locking occurs only when the distance has become large enough to reliably determine the direction
    drag_lock_min_distance       : 25
  },
  
  triggered: false,
  handler  : function dragGesture(ev, inst) {
    // current gesture isnt drag, but dragged is true
    // this means an other gesture is busy. now call dragend
    if(Hammer.detection.current.name != this.name && this.triggered) {
      inst.trigger(this.name + 'end', ev);
      this.triggered = false;
      return;
    }

    // max touches
    if(inst.options.drag_max_touches > 0 &&
      ev.touches.length > inst.options.drag_max_touches) {
      return;
    }

    switch(ev.eventType) {
      case Hammer.EVENT_START:
        this.triggered = false;
        break;

      case Hammer.EVENT_MOVE:
        // when the distance we moved is too small we skip this gesture
        // or we can be already in dragging
        if(ev.distance < inst.options.drag_min_distance &&
          Hammer.detection.current.name != this.name) {
          return;
        }

        // we are dragging!
        if(Hammer.detection.current.name != this.name) {
          Hammer.detection.current.name = this.name;
          if(inst.options.correct_for_drag_min_distance && ev.distance > 0) {
            // When a drag is triggered, set the event center to drag_min_distance pixels from the original event center.
            // Without this correction, the dragged distance would jumpstart at drag_min_distance pixels instead of at 0.
            // It might be useful to save the original start point somewhere
            var factor = Math.abs(inst.options.drag_min_distance / ev.distance);
            Hammer.detection.current.startEvent.center.pageX += ev.deltaX * factor;
            Hammer.detection.current.startEvent.center.pageY += ev.deltaY * factor;

            // recalculate event data using new start point
            ev = Hammer.detection.extendEventData(ev);
          }
        }

        // lock drag to axis?
        if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance <= ev.distance)) {
          ev.drag_locked_to_axis = true;
        }
        var last_direction = Hammer.detection.current.lastEvent.direction;
        if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
          // keep direction on the axis that the drag gesture started on
          if(Hammer.utils.isVertical(last_direction)) {
            ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
          }
          else {
            ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
          }
        }

        // first time, trigger dragstart event
        if(!this.triggered) {
          inst.trigger(this.name + 'start', ev);
          this.triggered = true;
        }

        // trigger normal event
        inst.trigger(this.name, ev);

        // direction event, like dragdown
        inst.trigger(this.name + ev.direction, ev);

        // block the browser events
        if((inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
          (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
          ev.preventDefault();
        }
        break;

      case Hammer.EVENT_END:
        // trigger dragend
        if(this.triggered) {
          inst.trigger(this.name + 'end', ev);
        }

        this.triggered = false;
        break;
    }
  }
};

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
  name    : 'hold',
  index   : 10,
  defaults: {
    hold_timeout  : 500,
    hold_threshold: 1
  },
  timer   : null,
  handler : function holdGesture(ev, inst) {
    switch(ev.eventType) {
      case Hammer.EVENT_START:
        // clear any running timers
        clearTimeout(this.timer);

        // set the gesture so we can check in the timeout if it still is
        Hammer.detection.current.name = this.name;

        // set timer and if after the timeout it still is hold,
        // we trigger the hold event
        this.timer = setTimeout(function() {
          if(Hammer.detection.current.name == 'hold') {
            inst.trigger('hold', ev);
          }
        }, inst.options.hold_timeout);
        break;

      // when you move or end we clear the timer
      case Hammer.EVENT_MOVE:
        if(ev.distance > inst.options.hold_threshold) {
          clearTimeout(this.timer);
        }
        break;

      case Hammer.EVENT_END:
        clearTimeout(this.timer);
        break;
    }
  }
};

/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
  name   : 'release',
  index  : Infinity,
  handler: function releaseGesture(ev, inst) {
    if(ev.eventType == Hammer.EVENT_END) {
      inst.trigger(this.name, ev);
    }
  }
};

/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
  name    : 'swipe',
  index   : 40,
  defaults: {
    // set 0 for unlimited, but this can conflict with transform
    swipe_min_touches: 1,
    swipe_max_touches: 1,
    swipe_velocity   : 0.7
  },
  handler : function swipeGesture(ev, inst) {
    if(ev.eventType == Hammer.EVENT_END) {
      // max touches
      if(inst.options.swipe_max_touches > 0 &&
        ev.touches.length < inst.options.swipe_min_touches &&
        ev.touches.length > inst.options.swipe_max_touches) {
        return;
      }

      // when the distance we moved is too small we skip this gesture
      // or we can be already in dragging
      if(ev.velocityX > inst.options.swipe_velocity ||
        ev.velocityY > inst.options.swipe_velocity) {
        // trigger swipe events
        inst.trigger(this.name, ev);
        inst.trigger(this.name + ev.direction, ev);
      }
    }
  }
};

/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
  name    : 'tap',
  index   : 100,
  defaults: {
    tap_max_touchtime : 250,
    tap_max_distance  : 10,
    tap_always        : true,
    doubletap_distance: 20,
    doubletap_interval: 300
  },
  handler : function tapGesture(ev, inst) {
    if(ev.eventType == Hammer.EVENT_END && ev.srcEvent.type != 'touchcancel') {
      // previous gesture, for the double tap since these are two different gesture detections
      var prev = Hammer.detection.previous,
        did_doubletap = false;

      // when the touchtime is higher then the max touch time
      // or when the moving distance is too much
      if(ev.deltaTime > inst.options.tap_max_touchtime ||
        ev.distance > inst.options.tap_max_distance) {
        return;
      }

      // check if double tap
      if(prev && prev.name == 'tap' &&
        (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
        ev.distance < inst.options.doubletap_distance) {
        inst.trigger('doubletap', ev);
        did_doubletap = true;
      }

      // do a single tap
      if(!did_doubletap || inst.options.tap_always) {
        Hammer.detection.current.name = 'tap';
        inst.trigger(Hammer.detection.current.name, ev);
      }
    }
  }
};

/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
  name    : 'touch',
  index   : -Infinity,
  defaults: {
    // call preventDefault at touchstart, and makes the element blocking by
    // disabling the scrolling of the page, but it improves gestures like
    // transforming and dragging.
    // be careful with using this, it can be very annoying for users to be stuck
    // on the page
    prevent_default    : false,

    // disable mouse events, so only touch (or pen!) input triggers events
    prevent_mouseevents: false
  },
  handler : function touchGesture(ev, inst) {
    if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
      ev.stopDetect();
      return;
    }

    if(inst.options.prevent_default) {
      ev.preventDefault();
    }

    if(ev.eventType == Hammer.EVENT_START) {
      inst.trigger(this.name, ev);
    }
  }
};

/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
  name     : 'transform',
  index    : 45,
  defaults : {
    // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
    transform_min_scale   : 0.01,
    // rotation in degrees
    transform_min_rotation: 1,
    // prevent default browser behavior when two touches are on the screen
    // but it makes the element a blocking element
    // when you are using the transform gesture, it is a good practice to set this true
    transform_always_block: false
  },
  triggered: false,
  handler  : function transformGesture(ev, inst) {
    // current gesture isnt drag, but dragged is true
    // this means an other gesture is busy. now call dragend
    if(Hammer.detection.current.name != this.name && this.triggered) {
      inst.trigger(this.name + 'end', ev);
      this.triggered = false;
      return;
    }

    // atleast multitouch
    if(ev.touches.length < 2) {
      return;
    }

    // prevent default when two fingers are on the screen
    if(inst.options.transform_always_block) {
      ev.preventDefault();
    }

    switch(ev.eventType) {
      case Hammer.EVENT_START:
        this.triggered = false;
        break;

      case Hammer.EVENT_MOVE:
        var scale_threshold = Math.abs(1 - ev.scale);
        var rotation_threshold = Math.abs(ev.rotation);

        // when the distance we moved is too small we skip this gesture
        // or we can be already in dragging
        if(scale_threshold < inst.options.transform_min_scale &&
          rotation_threshold < inst.options.transform_min_rotation) {
          return;
        }

        // we are transforming!
        Hammer.detection.current.name = this.name;

        // first time, trigger dragstart event
        if(!this.triggered) {
          inst.trigger(this.name + 'start', ev);
          this.triggered = true;
        }

        inst.trigger(this.name, ev); // basic transform event

        // trigger rotate event
        if(rotation_threshold > inst.options.transform_min_rotation) {
          inst.trigger('rotate', ev);
        }

        // trigger pinch event
        if(scale_threshold > inst.options.transform_min_scale) {
          inst.trigger('pinch', ev);
          inst.trigger('pinch' + ((ev.scale < 1) ? 'in' : 'out'), ev);
        }
        break;

      case Hammer.EVENT_END:
        // trigger dragend
        if(this.triggered) {
          inst.trigger(this.name + 'end', ev);
        }

        this.triggered = false;
        break;
    }
  }
};

  // Based off Lo-Dash's excellent UMD wrapper (slightly modified) - https://github.com/bestiejs/lodash/blob/master/lodash.js#L5515-L5543
  // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
  if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // define as an anonymous module
    define('hammer', [], function() {
      return Hammer;
    });
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
  }
  else if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = Hammer;
  }
  else {
    window.Hammer = Hammer;
  }
})(this);
/*
 * Query selector.
 */
define('fw/Query', ['hammer'], function(Hammer) { 

return (function(window){

	/**
     * internal helper to select a string and return
	 */
	function select(base, selector) {
		return (/^\.([\w-]+)$/.test(selector) && base.getElementsByClassName?
					base.getElementsByClassName(RegExp.$1) :

			   (/^#([\w-]*)$/.test(selector)?
			   		(selector = base.getElementById(RegExp.$1))? [selector] : []:

			   (/^[\w-]+$/.test(selector)?
			   		base.getElementsByTagName(selector) :

					base.querySelectorAll(selector)
		)))
	}

	/**
     * helper hasClass one single element
	 */
	function _hasClass(el, name) {
		return new RegExp("\\s+"+name+"\\s+").test(' ' + el.className + ' ');
	}

	/**
	 * Q object constructor
	 * @constructor
	 */
	function Q(elements) {
		this.length = elements.length;
		this.nodes = elements;
	}

	// base methods
	//  this -> thw Q object itself
	Q.prototype = {
		isQ: true,

		// find children
		find: function(selector) {
			var els = [];
			this.each(function(el) {
				var subels = select(el, selector);
				for (var i = 0; i < subels.length; i++) {
					els.push(subels[i]);
				}
			});
			return new Q(els);
		},

		// get the internal DOM node; without arg, return an array with all DOM nodes. [jquery compatible]
		get: function(index) {
			return index == undefined ? this.nodes : this.nodes[index] // [index >= 0 ? index : index + this.length];
		},

        on: function(events, callback) {
            var _this = this;
            var _events = events.split(/\s*,\s*/);

            return _this.each(function(el) {
                for (var evt = _events[0], i = 0; i < _events.length; evt = _events[++i]) {

                	// special touch event
                    if ((evt == 'tap' || evt == 'hold') && window.addEventListener) {
                        Hammer(el, {drag: false, swipe: false, transform: false}).on(evt, function() {
                            callback.apply(el, arguments);
                        });
                    } else {
                        // standard events
                        if (window.addEventListener) {
                            el.addEventListener(evt, callback, false);
                        } else {
                        	// IE
                        	if (evt == 'tap') evt = 'click';
                            el.attachEvent('on' + evt, function(e) {

                            	// normalize Event object for IE8
                    			e.preventDefault = function() { window.event.returnValue = false; }
                    			e.stopPropagation = function() { window.event.cancelBubble = true; }

                        		callback.call(el, e);
                        	});
                        }
                    }
                }
            });
        },

		// returns true if at least one element hasClass. [jquery compatible]
		hasClass: function(name) {
			var has = false;
			this.each(function(el){
				if (!has)
					has = _hasClass(el, name)
			});
			return has;
		}

	};


	// extend with simple iteration functions
	//  this -> single DOM element
	var extensions = {
		each: function(fn) {
			fn.call(this, this);
		},

		// content (only set content)
		text: function(text) {
			this.textContent = text;
		},
		html: function(html) {
			this.innerHTML = html;
		},

		// visibility
		hide: function() {
			this.style.display = 'none'
		},
		show: function() {
			this.style.display = ''
		},

		// class
		addClass: function(name) {
			this.className += ' ' + name;
		},
		removeClass: function(name) {
			this.className = (' ' + this.className + ' ').replace(new RegExp("\\s+("+name+"\\s+)+","g"), ' ').replace(/^\s+/,'').replace(/\s+$/,'');
		},
        toggleClass: function(name) {
            if (_hasClass(this, name)) extensions.removeClass.call(this, name);
            else extensions.addClass.call(this, name);
        },

        // dom manipulation
		insertAfter: function(newNode) {
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
	};

	// extend simple iteration functions
	for (var name in extensions) {
		(function(name){
			Q.prototype[name] = function() {
				var _args = arguments;
				for (var i = 0; i < this.nodes.length; i++) {
					extensions[name].apply(this.nodes[i], _args);
				}
				return this;
			}
		})(name);
	}




	/*
     * Public API:
	 */
	return function(elements) {

		// select elements
		if (!elements) // HANDLE: "", null, undefined, false
			elements = [];

		if (elements.isQ) 	// already Q-object? return it and prevent double wrap
			return elements;

		if (typeof elements == 'string') // string? select elements
			elements = select(document, elements);
		else {
			var toString = Object.prototype.toString.call(elements);
			if (toString !== '[object Array]' && toString !== '[object NodeList]')  // objects but not array or nodelist?
				elements = [elements];
		}

		// return new Q object
		return new Q(elements);
	};

})(window);

});
define('fw/Creator', [], function() {
	return function(tagName, options) {
		var el = document.createElement(tagName);
		
		if (options.innerHTML) el.innerHTML = options.innerHTML;
		else if (options.innerText) el.textContent = options.innerText;
		
		for (option in options) {
			el.setAttribute(option, options[option]);
		}
		
		return el;
	}
});
/*
 * AJAX.
 * 
 *   A.get(url)
 *   A.get(url, onsuccess)
 *   A.get(url, options)
 * 
 *  - options:
 *  	params
 *      success
 *      error
 */
define('fw/Ajax', [], function() {
	return (function(window, encodeURIComponent, CONTENT_TYPE) {
		
		/*
		 * Call Ajax with specified param.
		 */
		function doAjax(method, url, options) {
			if (typeof options == "function")
				options = {success: options};

			// normalize callback arguments
			var onerror = options.error || function(e){console.log(e);};
			var onsuccess = options.success || function(){};
			
			// IE7+ already supports XMLHttpRequest
			var request = new XMLHttpRequest();
			
			// register callbacks
			request.onreadystatechange = function() {
				if (request.readyState == 4) {
					var error;
					if ((request.status >= 200 && request.status < 300) || request.status == 304) { // if borrowed from Zepto.js
						
						// process result
						try {
							var result = request.responseText
							if (request.getResponseHeader(CONTENT_TYPE) == 'application/json') {
								result = JSON.parse(result); // JSON object available on IE8+ 
							}
							// TODO detect XML and return responseXml
							// TODO detect HTML? JS?
						} catch (e) { error = e; }
						
						// callbacks
						if (error) onerror.call(window, error, request);
						else onsuccess.call(window, result, request);
					} else {
						onerror.call(window, 'Ajax failed', request);
					}
				}
			};
			
			// data payload
			var data = serializeObject(options.params);
			
			// query string if GET
			if (method == 'GET' && data) {
				url += (url.indexOf('?') >= 0 ? '&' : '?') + data;
			}
			
			// send async
			request.open(method, url, true);
			
			// headers if post
			if (method == 'POST') {
				//request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				request.setRequestHeader(CONTENT_TYPE, 'application/x-www-form-urlencoded');
			}
			
			// send payload data
			request.send(data? data : null);
		}
		
		function serializeObject(object) {
		    var result = [];
	        for (var key in object) {
	            var value = object[key];
	            if (value && value.constructor == Array) {
	                for (var i in value) {
	                	result[result.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value[i]);
	                }
	            }else {
	            	result[result.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
	            }
	        }
		    return result.join('&').replace(' ', '+');
		}
		
		// public api
		return {
			get: function(url, options) {
				doAjax('GET', url, options || {});
			},
			post: function(url, options) {
				doAjax('POST', url, options || {});
			}
		}
	})(window, encodeURIComponent, 'Content-Type');
});
/*
 * Cookie extension.
 * Based on jquery.cookie plugin, but without jquery
 */



/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

define('fw/ext/Cookie', [], function() {
return function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].replace(/^\s+|\s+$/g, '');
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
});
/*
 * Dom ready extension.
 */
define(function(){

  /*!
    * domready (c) Dustin Diaz 2012 - License MIT
    */
  var domready = (function domready(ready) {

    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , readyState = 'readyState'
      , loaded = /^loade|c/.test(doc[readyState])

    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }

    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)


    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    })

    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })

  })();


  domready(function(){
    define('domready',[],function(){});
  })

});
// tracker inicial do analytics
var _gaq = [
	// account normal é 'UA-270161-1' e account de funcionarios é 'UA-270161-16'
	['_setAccount', 'UA-270161-1' + (document.cookie && document.cookie.indexOf('caelum-funcionario') != -1  ? '6' : '') ],
	['_setDomainName', '.caelum.com.br'],
	['_setSiteSpeedSampleRate', 100],
	['_trackPageview']
];

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// analytics: track external links
define(['fw/Query', 'domready'], function(Q){
	if (!document.querySelectorAll) return;

	var rootUrl = location.protocol + '//' + (location.hostname||location.host) + 
				((document.location.port||false) ? ':' + location.port : '') + '/';

	function track(elements) {
		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];

			// skips .dont-track links
			if (el.className == 'dont-track') continue;

			// skips self links
			if (el.href.indexOf(rootUrl) === 0) continue;

			// track
			Q(el).on('click', function(){
				_gaq.push(['_trackPageview', '/LinkExternoApostila/' + this.href]);
			});
		}
	}

	track(document.querySelectorAll('a[href^="http://"]'));
	track(document.querySelectorAll('a[href^="https://"]'));
});
// preparar códigos pra serem selecionaveis
define(['domready'], function(){
	if (!document.querySelectorAll) return;

	var codes = document.querySelectorAll('div.highlight');
	for (var i = 0; i < codes.length; i++) {
		var div = codes[i];
		var pre = div.querySelector('pre');

		// pula se codigo nao for com linha
		if (pre.querySelectorAll('.lineno').length == 0) continue;

		// clona codigo com linhas
		var linenos = pre.cloneNode(true);

		linenos.className = 'linenoscol';
		pre.className = 'maincode';

		div.appendChild(linenos);
	}
});
define(['fw/Query', 'fw/Creator', 'domready'], function(Q, C){
	console.log('lead-capture');

	// feature detect
	if (! ('localStorage' in window)) return;

	// DOM els
	var body = document.body;
	var $body = Q(body);
	var overlay, popup;

	// storage
	var jaMostrou = !!localStorage.getItem('lead-capture-show');
	if (!jaMostrou) {
		create();
		show();
	}

	function show() {
		$body.addClass('lead-capture-active');
		localStorage.setItem('lead-capture-show', new Date().getTime());
	}

	function hide() {
		$body.removeClass('lead-capture-active');
		localStorage.setItem('lead-capture-closed', new Date().getTime());
	}

	function create() {
		console.log('criando');

		overlay = C('div', {
			class: 'lead-capture-overlay'
		});

		popup = C('iframe', {
			class: 'lead-capture-popup',
			src: '/_apostila_aberta_form/'
		});

		body.appendChild(overlay);
		body.appendChild(popup);

		// clique no overlay
		overlay.addEventListener('click', hide);

		// ESC
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			if (evt.keyCode == 27) {
				hide();
			}
		};

		// expõe pro iframe
		window.leadCaptureClose = hide;
	}




});

// navegacao do menu dropdown do topo
define(['fw/Query', 'domready'], function(Q){
	Q('.chapter-nav').on('change', function() {
		var slug = this.value;
		if (slug === undefined || slug === '' || slug === 'undefined') return;
		location.href = slug;
	});
});

// interface functionality
define(['fw/Query', 'fw/Ajax', 'fw/ext/Cookie', 'domready'], function(Q, A, cookie){

	// detect appcache
	if (!window.applicationCache) {
		console.log('AppCache not supported');
		Q(document.documentElement).addClass('no-appcache');

		// track
		_gaq.push(['_trackEvent', 'Apostilas offline', 'Não suportado', navigator.userAgent, 0, true]);

		return;
	} else {
		Q(document.documentElement).addClass('appcache');
	}

	// helpers
	function resetInstallationProgress() {
		try {
			var el = Q('.offline-installation-progress').get(0);
			el.progress = undefined;
			el.className = 'offline-installation-progress';
			el.style.width = '';
		} catch (e) {}
	}

	// globals
	var apostila_slug = location.pathname.replace(/\/([^\/]+)\/.*/,'$1');

	// install method
	Q('.offline-install-button, .offline-update-button').on('click', function() {
		console.log('Initiating installation');

		resetInstallationProgress();

		// set cookie
		cookie(apostila_slug, 'update', { expires: 7, path: '/' + apostila_slug + '/' });

		// request iframed installation
		Q('.offline-installation').html('<iframe src="install.html" class="offline-install-iframe"></iframe>');

		// track
		_gaq.push(['_trackEvent', 'Apostilas offline', 'Instalação', apostila_slug]);
	});

	// remove method
	Q('.offline-remove-button').on('click', function() {
		console.log('Removing installation');

		resetInstallationProgress();

		// set cookie
		cookie(apostila_slug, 'remove', { expires: 7, path: '/' + apostila_slug + '/' });

		// request iframed installation
		Q('.offline-installation').html('<iframe src="install.html" class="offline-install-iframe"></iframe>');

		// track
		_gaq.push(['_trackEvent', 'Apostilas offline', 'Desinstalação', apostila_slug]);
	});

	// debug info
	var cachedVersion = localStorage.getItem(apostila_slug);
	if (cachedVersion) {
		console.log('Cached version: ' + cachedVersion);
		Q(document.documentElement).addClass('offline-installed');

		// track
		_gaq.push(['_trackEvent', 'Apostilas offline', 'Versão instalada', cachedVersion]);
	} else {
		Q(document.documentElement).addClass('offline-not-installed');
	}

	// check updates
	if (cachedVersion) {
		A.get('/' + apostila_slug + '/offline/_last_version', function(serverVersion) {
			console.log('Server version: ' + serverVersion);

			if (serverVersion !== cachedVersion) {
				Q(document.documentElement).addClass('offline-update-available');
			}
		});
	}


	// offline events

	window._offline = [];


	// after installation, hold future automatic updates
	function holdFutureUpdates() {
		// delete update cookie marker
		cookie(apostila_slug , 'ok', { path: '/' + apostila_slug + '/' });
	}

	// show progress
	function showInstallationProgress(progress) {
		// fake progress
		if (!progress) {
			var oldProgress = Q('.offline-installation-progress').get(0).progress || 0;
			progress = oldProgress + 1;

			if (progress >= 80) progress = 80;
		}

		// start big
		if (progress < 5) progress = 5;

		// update
		Q('.offline-installation-progress').get(0).style.width = progress + '%';
		Q('.offline-installation-progress').get(0).progress = progress;


		// if finished, delegate visual do main css
		if (progress >= 100) {
			Q('.offline-installation-progress').addClass('ok');
			Q('.offline-installation-progress').get(0).style.width = '';
		}
	}


	// register installation successfull
	function registerInstalledVersion() {
		// get current version and save on localStorage
		// XXX last_version could be newer than the real installed version. but it's very unlikely
		A.get('/' + apostila_slug + '/offline/_last_version', function(data) {
			console.log('New installed version: ' + data);
			localStorage.setItem(apostila_slug, data);
		});

		// update main window UI
		Q(top.document.documentElement)
			.removeClass('offline-not-installed').removeClass('offline-update-available')
			.addClass('offline-installed');
	}
	
	// after installation register new version
	_offline['cached'] = _offline['updateready'] = _offline['noupdate'] = function(e){
		registerInstalledVersion();
		showInstallationProgress(100);
		holdFutureUpdates();
	};

	// if error occurs, mark it
	_offline['error'] = function(){
		console.log("AppCache: error.")
		localStorage.removeItem(apostila_slug);
		Q('.offline-installation-progress').addClass('error');

		// track
		_gaq.push(['_trackEvent', 'Apostilas offline', 'Error', apostila_slug]);
	};

	// after removal, destroy local version marker and reload
	_offline['obsolete'] = function(){
		console.log("AppCache: obsolete.")
		localStorage.removeItem(apostila_slug);
		showInstallationProgress(100);
		Q('.offline-installation-progress').addClass('removed');

		// update main window UI
		Q(top.document.documentElement)
			.removeClass('offline-installed').removeClass('offline-update-available')
			.addClass('offline-not-installed');
	};

	// download progress
	// (firefox doesnt have loaded/total - https://bugzilla.mozilla.org/show_bug.cgi?id=825618)
	_offline['progress'] = function(e){
		if (e.loaded && e.total) {
			showInstallationProgress(100 * e.loaded / e.total);
		} else {
			showInstallationProgress(); // fake it
		}
	};
});





// lista apostilas offline disponiveis
define(['fw/Query', 'domready'], function(Q){
	if (Q('.lista-apostilas-offline').length) {
		
		for (var i = 0; i < localStorage.length; i++){
			var key = localStorage.key(i);
			if (key.indexOf('apostila-') == 0) { //startsWith
				var nome = nomes[key] || key;

				var li = document.createElement('li');
				li.innerHTML = '<a href="/'+key+'/">'+nome+'</a>';
				Q('.lista-apostilas-offline').get(0).appendChild(li);
			}
		}
	}
});



// running iOS webapp
if(("standalone" in window.navigator) && window.navigator.standalone){

	// globals
	var apostila_slug = location.pathname.replace(/\/([^\/]+)\/.*/,'$1');
	var appversion = localStorage.getItem(apostila_slug);
	var is_installed = !!appversion;

	// first-time user installation process
	define(['fw/Query', 'fw/ext/Cookie', 'domready'], function(Q, cookie){	
		if (!is_installed) {

			// if the installation point isn't the offline installation page,
			// redirect there and do nothing else.
			if (!Q('.offline').length) {
				location.href = '/' + apostila_slug + '/offline/';

			} else {
				// we already are in offline installation page.
				// so trigger appcache installation right away
				cookie(apostila_slug, 'update', { expires: 7, path: '/' + apostila_slug + '/' });
				Q('.offline-installation').html('<iframe src="install.html" class="offline-install-iframe"></iframe>');

				// set initial page as home
				localStorage.setItem('page', '/' + apostila_slug + '/');

				// track
				_gaq.push(['_trackEvent', 'Apostilas offline', 'Instalação iOS Web App', apostila_slug]);
			}
		}	
	});


	// installed users:
	// check if current page is the same one we should be showing.
	// this makes the app reopens on last page viewed instead of installation point.
	if (is_installed) {
		var page = localStorage.getItem('page');
		if (page) {

			// check if page is the last one selected.
			// if different, it's probable we are reopening the app, so we go to the lastPage
			if (page !== location.pathname + location.hash) {
				location.href = page;
			} else {

				// if this is the right page, 
				// do nothing and stay here
			}

		} else {

			// if empty, this means we are navigating to this new page now.
			// we save it for future reference and stay here
			localStorage.setItem('page', location.pathname + location.hash);

			// TODO rewrite this as we scroll subsections and hash changes
		}
	}

	// the page was intially hidden.
	// after we check URLs and everything, we show the page to the user.
	document.documentElement.style.display = 'block';

	// trigger navigation links via JS
	// https://gist.github.com/kylebarrow/1042026
	document.addEventListener('click', function(event) {
		var noddy = event.target;
		
		// Bubble up until we hit link or top HTML element. 
		// Warning: BODY element is not compulsory so better to stop on HTML
		while(noddy.nodeName !== "A" && noddy.nodeName !== "HTML") {
	        noddy = noddy.parentNode;
	    }

	    var href = noddy.getAttribute('href');
		
		if(href && 
				(href.indexOf('/' + apostila_slug) == 0 || // all absolute links to the app
				(href.indexOf('http:') === -1 && href.indexOf('/') !== 0) // local relative links
			)){

			event.preventDefault();
			document.location.href = href;

			// we are navigating locally. so the next page is the one.
			// so we remove the old 'page' marker and wait for the new page.
			localStorage.removeItem('page');
		}
	}, false);


	define(['fw/Query', 'domready'], function(Q){
		Q('.chapter-nav').on('change', function() {
			// we are navigating locally. so the next page is the one.
			// so we remove the old 'page' marker and wait for the new page.
			localStorage.removeItem('page');
		});
	});
}

// detect iOS
var iOS = navigator.userAgent.match(/iP(ad|hone|od)/i);
if (iOS) {
	document.documentElement.className += ' ios';
}


// opcoes avancadas no topo
define(['fw/Query', 'domready'], function(Q){
	// cache elements
	var config = Q('.config').get(0);
	var icone = Q('.config .icone').get(0);
	var submenu = Q('.config .submenu').get(0);

	// menu no topo
	Q(icone).on('tap', function(evt){
		// adiciona classe se clicar no icone
		Q(config).toggleClass('ativo');
	});
	Q(window).on('click', function(evt){
		// remove classe ativo se clicar em qualquer outro lugar que nao seja o icone ou formulário
		if (evt.target !== icone && evt.target.tagName && evt.target.tagName !== 'INPUT' && evt.target.tagName !== 'SELECT') {
			Q(config).removeClass('ativo');
		}
	});

	// submitador de formulario
	Q('.form-action').on('click', function(){
		this.parentNode.submit();
	});
});
// sombra do topo descendo a la Google+
define(['fw/Query', 'domready'], function(Q){
	var tamanhoSombra = 14;
	var sombra = Q('.barra-topo .sombra').get(0);

	if (!sombra || !window.scrollY) return;

	// init
	sombra.style.top = '-'+tamanhoSombra+'px';

	// no scroll, atualiza sombra
	Q(window).on('scroll, resize, rotationchange', function () {
		var borda = tamanhoSombra - window.scrollY / 6;
		if (borda < 0) borda = 0;
		else if (borda > tamanhoSombra) borda = tamanhoSombra;

		borda = '-' + borda + 'px';

		if (sombra.style.top != borda) {
			sombra.style.top =  borda;
		}
	});
});
// funcionalidade de trackear a seção scrollada no #hash da URL
define(['fw/Query', 'domready'], function(Q){

	// helper fn:
	// observa scroll e resize e rotate mas com limite de rate.
	function onSmoothScroll(callback, interval) {
		var timer = undefined;
		Q(window).on('scroll, resize, rotationchange', function () {
			timer && clearTimeout(timer);
			timer = setTimeout(callback, interval);
		});
	}

	// feature detect:
	//  só aceita se tiver History API
	if (!("history" in window && "replaceState" in window.history)) return;

	// indica que o proximo scroll deve ser cancelado
	var cancelScroll = false;

	// cache das secoes do documento
	var secoes = document.querySelectorAll('h2');
	if (secoes.length == 0) return;

	// descobre a seção sendo vista
	onSmoothScroll(function(){
		// limite para troca de seção é o título ter passado da metade
		// da parte visível da tela.
		var limite = Math.floor(window.scrollY + window.innerHeight / 2);

		// percorre todos as seções em busca da atualmente visivel
		var secaoAtual = undefined;
		for (var i = 0; i < secoes.length; i++) {
			// ja passamos da altura? o ultimo 'secaoAtual' que vale entao
			if (secoes[i].offsetTop > limite) break;

			secaoAtual = secoes[i];
		}

		// manda a secaoAtual pra History
		if (secaoAtual !== undefined) {
			var slug = secaoAtual.getAttribute('id');
			if (slug !== location.hash.replace('#','')) {
				history.replaceState({scroll: true}, '', '#' + slug);
			}
		} else if (location.hash.replace('#','') !== '' && location.pathname) {
			// se nao houver secao selecionada, provavelmente estamos no topo do capitulo.
			// ai é melhor nao ter #hash nenhum e deixar a URL do capitulo mesmo.
			history.replaceState({scroll: true}, '', location.pathname);
		}
	}, 200);
});
