sap.ui.define("controller/layout/EqualWidthColumns", [
	"sap/ui/core/Control"
	
], function(Control) {
	"use strict";
	
	// if _isDebugMode is true, additional HTML comments are written to facilitate the analysis of the generated HMTL code
	var _isDebugMode = true;
	
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
	    	properties: { 
	    		// use		: { type: "string" } // use = 'text' results in a padding of 1 em to the right, otherwise 0
	    	},
	        // example: could have  "boxColor" : "string"  // the color to use for ... 
	      
	        defaultAggregation : "content",
	        aggregations: {
            	content: {singularName: "content"} // default type is "sap.ui.core.Control", multiple is "true"
        	}
	    },

	    renderer : {
	    	render: function(oRm, oControl) { // static function, so use the given "oControl" instance
		        // instead of "this" in the renderer function
		        if (_isDebugMode) { oRm.write("<!-- EWC 1. (Lev 1 open) -->"); }
		        oRm.write("<div");
				oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
				oRm.addClass("EWC_L1");
		        oRm.writeClasses();              // there is no class to write, but this enables
		                                         // support for ColorBoxContainer.addStyleClass(...)
				oRm.addStyle("display", "flex");                                         
				oRm.writeStyles();
		        oRm.write(">");
		
		        var aChildren = oControl.getContent();
		        for (var i = 0; i < aChildren.length; i++) { // loop over all child Controls,
		            // render the colored box around them
					if (_isDebugMode) { 
						oRm.write("<!-- EWC 2. (Lev 2 open), child " + i + " -->"); 						
					}
					oRm.write("<div");					
		            if (i === 0) {
						oRm.addStyle("flex", "4");
						oRm.addStyle("overflow", "hidden");						
		            } else {
						oRm.addStyle("flex", "3");
						oRm.addStyle("overflow", "hidden");
		            }					
					oRm.addStyle("padding", "0em");
					oRm.addClass("EWC_L2");
		            // oRm.addStyle("border", "1px solid black"); // specify the border around the child - for development only
		            oRm.writeStyles();
					oRm.write("><!-- ok child " + i + " -->");
					try {
		            	oRm.renderControl(aChildren[i]);   // render the child Control
					} catch (err) {
						// we saw some exceptions "Assertion failed: Method 'class' must be called with exactly one class name"
					}
					if (_isDebugMode) { oRm.write("<!-- EWC 3. (Lev 2 close), child " + i + " -->"); }
		            oRm.write("</div>"); // end of the box around the respective child
		        }
		        
		        if (_isDebugMode) { 
					oRm.write("<!-- EWC 4. (Lev 1 close), child " + i + " -->"); 
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