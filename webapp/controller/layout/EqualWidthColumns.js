sap.ui.define("controller/layout/EqualWidthColumns", [
	"sap/ui/core/Control"
	
], function(Control) {
	"use strict";
	
	/* This Control will render <div> tags for two or multiple columns with equal width. The rendered HTML/CSS is this (example)
	// root:
		<div style="flex"> 								// display: flex; (// flex box will result in equal height of children)
	// for each child of the control:
			<div style="flex: 1; padding: 0em"> 		// flex: 1 sets flex-growth to 1 for all children means the have same width; no padding
			...
			</div>
		</div>
	*/
	
	return Control.extend("controller/layout/EqualWidthColumns", {
		
	    metadata : {
	    	properties: { },
	        // example: could have  "boxColor" : "string"  // the color to use for ... 
	      
	        defaultAggregation : "content",
	        aggregations: {
            	content: {singularName: "content"} // default type is "sap.ui.core.Control", multiple is "true"
        	}
	    },

	    renderer : {
	    	render: function(oRm, oControl) { // static function, so use the given "oControl" instance
	        // instead of "this" in the renderer function
	        oRm.write("<div");
	        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
	        oRm.writeClasses();              // there is no class to write, but this enables
	                                         // support for ColorBoxContainer.addStyleClass(...)
			oRm.addStyle("display", "flex");                                         
			oRm.writeStyles();
	        oRm.write(">");
	
	        var aChildren = oControl.getContent();
	        for (var i = 0; i < aChildren.length; i++) { // loop over all child Controls,
	            // render the colored box around them
	            oRm.write("<div");
	            oRm.addStyle("flex", "1");
	            oRm.addStyle("padding", "0em");
	            // oRm.addStyle("border", "1px solid black"); // specify the border around the child - for development only
	            oRm.writeStyles();
	            oRm.write(">");
	            oRm.renderControl(aChildren[i]);   // render the child Control
	                                               // (could even be a big Control tree, but you don't need to care)
	            oRm.write("</div>"); // end of the box around the respective child
	        }
	        
	        oRm.write("</div>"); // end of the complete Control
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