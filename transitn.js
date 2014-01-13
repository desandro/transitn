/*!
 * Transitn
 * utility class for CSS transitions
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false*/

( function( window ) { 'use strict';

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

function isEmptyObj( obj ) {
  for ( var prop in obj ) {
    return false;
  }
  prop = null;
  return true;
}

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
function dashCase( str ) {
  return str.replace( /([A-Z])/g, function( $1 ){
    return '-' + $1.toLowerCase();
  });
}

function camelCase( str ) {
  return str.replace( /(\-[a-z])/g, function( $1 ) {
    return $1.toUpperCase().replace( '-' , '' );
  });
}

function transitionDefinition( EventEmitter, getStyleProperty ) {

// -------------------------- CSS3 support -------------------------- //

var transitionProperty = getStyleProperty('transition');

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  MozTransition: 'transitionend',
  OTransition: 'otransitionend',
  transition: 'transitionend'
}[ transitionProperty ];

// -------------------------- styleProperty -------------------------- //

var styleProperty = ( function() {
  // hashes of properties
  var vendorProperties = {};
  var standardProperties = {};

  var styleProperty = {
    // getVendor('transform') -> WebkitTransform
    getVendor: function( prop ) {
      var vendorProp = vendorProperties[ prop ];
      if ( !vendorProp ) {
        vendorProp = getStyleProperty( prop );
        // add to hashes
        vendorProperties[ prop ] = vendorProp;
        standardProperties[ vendorProp ] = prop;
      }
      return vendorProp;
    },
    // getStandard('WebkitTransform') -> transform
    getStandard: function( prop ) {
      return standardProperties[ prop ] || prop;
    }
  };

  return styleProperty;
})();


// -------------------------- Transitn -------------------------- //



function Transitn( properties ) {
  this.set( properties );
}

Transitn.prototype = new EventEmitter();
Transitn.prototype.constructor = Transitn;

// from
// to
// element
// duration
// timingFunction
// isCleaning
Transitn.prototype.set = function( props ) {
  extend( this, props );
};

// ----- css ----- //

Transitn.prototype.css = function( style ) {
  var elemStyle = this.element.style;

  for ( var prop in style ) {
    // use vendor property if available
    var vendorProp = styleProperty.getVendor( prop );
    elemStyle[ vendorProp ] = style[ prop ];
  }
};

Transitn.prototype._removeStyles = function( style ) {
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in style ) {
    cleanStyle[ prop ] = '';
  }
  this.css( cleanStyle );
};

var cleanTransitionStyle = {
  transitionProperty: '',
  transitionDuration: '',
  transitionTimingFunction: '',
  transitionDelay: ''
};

Transitn.prototype.removeTransitionStyles = function() {
  // remove transition
  this.css( cleanTransitionStyle );
};

// ----- transition ----- //

// non transition, just trigger callback
Transitn.prototype._nonTransition = function() {
  this.css( this.to );
  if ( this.isCleaning ) {
    this._removeStyles( this.to );
  }
  for ( var prop in this.to ) {
    this.emitEvent( 'transitionend', [ this, event, prop ] );
  }
};

/**
 * proper transition
 * @param {Object} args - arguments
 *   @param {Object} to - style to transition to
 *   @param {Object} from - style to start transition from
 *   @param {Boolean} isCleaning - removes transition styles after transition
 *   @param {Function} onTransitionEnd - callback
 */
Transitn.prototype._transition = function() {
  // redirect to nonTransition if no transition duration
  if ( !parseFloat( this.duration ) ) {
    this._nonTransition();
    return;
  }

  this.transitioningProperties = {};
  this.clean = {};

  for ( var prop in this.to ) {
    // keep track of transitioning properties
    this.transitioningProperties[ prop ] = true;
    // keep track of properties to clean up when transition is done
    if ( this.isCleaning ) {
      this.clean[ prop ] = true;
    }
  }

  // set from styles
  if ( this.from ) {
    this.css( this.from );
    // force redraw. http://blog.alexmaccaw.com/css-transitions
    var h = this.element.offsetHeight;
    // hack for JSHint to hush about unused var
    h = null;
  }
  // enable transition
  this.enable();
  // set styles that are transitioning
  this.css( this.to );
  // set flag
  this.isTransitioning = true;
};

Transitn.prototype.transition = Transitn.prototype[ transitionProperty ? '_transition' : '_nonTransition' ];

Transitn.prototype.enable = function() {
  // only enable if not already transitioning
  // bug in IE10 were re-setting transition style will prevent
  // transitionend event from triggering
  if ( this.isTransitioning ) {
    return;
  }

  // make transition: foo, bar, baz from style object
  var transitionProps = [];
  for ( var prop in this.to ) {
    // dash-ify camelCased properties like WebkitTransition
    prop = styleProperty.getVendor( prop );
    transitionProps.push( dashCase( prop ) );
  }
  // enable transition styles
  var transitionStyle = {
    transitionProperty: transitionProps.join(','),
    // TODO allow easy way to set default transitionDuration
    transitionDuration: this.duration || '0.4s'
  };
  if ( this.timingFunction ) {
    transitionStyle.transtionTimingFunction = this.timingFunction;
  }
  if ( this.delay ) {
    transitionStyle.transitionDelay = this.delay;
  }

  // listen for transition end event
  this.element.addEventListener( transitionEndEvent, this, false );

  this.css( transitionStyle );
};


// ----- events ----- //

// trigger specified handler for event type
Transitn.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

Transitn.prototype.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

Transitn.prototype.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

Transitn.prototype.ontransitionend = function( event ) {
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }

  // get property name of transitioned property, convert to prefix-free
  var propertyName = styleProperty.getStandard( camelCase( event.propertyName ) ); 

  // remove property that has completed transitioning
  delete this.transitioningProperties[ propertyName ];
  // check if any properties are still transitioning
  if ( isEmptyObj( this.transitioningProperties ) ) {
    // all properties have completed transitioning
    this.disable();
  }
  // clean style
  if ( propertyName in this.clean ) {
    // clean up style
    this.element.style[ event.propertyName ] = '';
    delete this.clean[ propertyName ];
  }

  this.emitEvent( 'transitionend', [ this, event, propertyName ] );
};

Transitn.prototype.disable = function() {
  this.removeTransitionStyles();
  this.element.removeEventListener( transitionEndEvent, this, false );
  this.isTransitioning = false;
};


return Transitn;

}

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( [
      'eventEmitter/EventEmitter',
      'get-style-property/get-style-property'
    ],
    transitionDefinition );
} else {
  // browser global
  window.Transitn = transitionDefinition(
    window.EventEmitter,
    window.getStyleProperty
  );
}

})( window );
