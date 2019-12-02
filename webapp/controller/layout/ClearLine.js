sap.ui.define("controller/layout/ClearLine", [
	"sap/ui/core/Control"
	
], function(Control) {
	"use strict";

	return Control.extend("controller/layout/ClearLine", {
		
	    metadata : {
	    	properties: { 
	    		style		: { type: "string" } 
	    	},
	        // example: could have  "boxColor" : "string"  // the color to use for ... 
	      
	        /* defaultAggregation : "content",
	        aggregations: {
            	content: {singularName: "content"} // default type is "sap.ui.core.Control", multiple is "true"
        	} */
	    },

		/* helps to clean up/fix CSS settings, e.g. render a "clear: both" */
	    renderer : {
	    	render: function(oRm, oControl) { // static function, so use the given "oControl" instance
		        // instead of "this" in the renderer function
		        oRm.writeEscaped("<div class='" + oControl.getStyle() + "' ");
		        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
		        // oRm.writeClasses();              // there is no class to write, but this enables
		                                         // support for ColorBoxContainer.addStyleClass(...)
				oRm.writeStyles();
				oRm.write(" />");
		    }
	    }, 
	    
	    onAfterRendering: function() {
	    	// if you need to do any post render actions, it will happen here
            if(sap.ui.core.Control.prototype.onAfterRendering) {
                 sap.ui.core.Control.prototype.onAfterRendering.apply(this,arguments); //run the super class's method first
            }
	    }
	});
});