
// custom event pollyfill for android webview
  if(!window.CustomEvent) {
    var CustomEvent;

    CustomEvent = function(event, params) {
      var evt;
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
      };
      evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
 }

 if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}
console.log("checking libs..")
console.log(Math.sin);
console.log(Math.cos);