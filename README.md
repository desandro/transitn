# Transitn

_JS utility class for CSS transitions_

Used in [Outlayer](github.com/metafizzy/outlayer) for [Masonry](http://masonry.desandro.com), [Isotope](http://isotope.metafizzy.co), and [Packery](http://packery.metafizzy.co)

``` js
// create transition
var transition = new Transitn({
  element: document.querySelector('#elem'),
  duration: '0.5s',
  to: {
    opacity: 1,
    transform: 'scale(1)'
  }
});
// start transition
transition.start();
```


## Install

Transitn has dependencies. Install with [Bower](http://bower.io) to get them.

``` bash
bower install desandro/transitn
```

## Properties

``` js
var transition = new Transitn({  
  // {Element} element being transitioned, required
  element: document.querySelector('#elem'), 
  // {Object} style immediately set, optional
  from: {
    display: 'block',
    opacity: 0
  },
  // {Object} style transition to, required
  to: {
    // munges 'transform' to appropriate vendor-prefixed property
    transform: 'translate( 200, 100 )',
    opacity: 0.5
  },
  // {String} duration of transition, required
  duration: '0.4s',
  // {String} delay before transition starts, optional
  delay: '0.2s',
  // {String} timing function / easing, optional
  timingFunction: 'ease-in-out',
  // {Boolean} removes to transition styles when transition ends, optional
  isCleaning: true
});
```

## Methods

``` js
// start transition
transition.start()

// bind event
transition.on( 'transitionend', function() {...} )

// bind event once
transition.once( 'transitionend', function() {...} )

// unbind event
transition.off( 'transitionend', function() {...} )
```

## transitionend Event

``` js
transition.on( 'transitionend', function( _trnstn, property, event ) {
  console.log( 'transition on ' + property + ' ended' );
});
```

+ `_trnstn` _Transitn_ - Transitn instance
+ `property` _String_ - Standardized property name of ended transition
+ `event` _Event_ - original transitionend event. Not available if transition was immediately executed (<IE10, and when duration == 0).
