sap.ui.define("controller/layout/ResultLine", [
	"sap/ui/core/Control"
	
], function(Control) {
	"use strict";
	
	/* This Control will render a headline and the corresponding tags */
	
	var ResultLine = Control.extend("controller/layout/ResultLine", {
		
	    metadata : {
	    	properties: { 
	    		title		: { type: "string" }, // The title of the check, engine, or user; if set, there will be a 1em space to the upper element
	    		label		: { type: "string" }, // Alternative to title - a simple lable instead of a title, no space to previous element, no bold etc.
	    		tag			: { type: "string" }, // The XML tag (without < and >) in the LAW file, e.g. GenericId for <GenericId>
	    		text			: { type: "string" } // The XML text in the LAW file, e.g. CHKP000000DELU
	    	},
	        // example: could have  "boxColor" : "string"  // the color to use for ... 
	      
	        defaultAggregation : "content",
	        aggregations: {
            	content: {singularName: "content"} // default type is "sap.ui.core.Control", multiple is "true"
        	}
	    },
	    
	    init: function () {
	    },

	    renderer : {
	    	render: function(oRm, oControl) { // static function, so use the given "oControl" instance
		    	oControl.destroyContent(); // if removed, switching to the 'Properties' tab and back will add a furher title/lable "Deleted Users" each time

		        // instead of "this" in the renderer function
		        oRm.write("<div ");
		        if (oControl.getTitle() && oControl.getTitle() !== "") {
		        	oRm.addStyle("padding-top", "1em");
		        }
		        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
		        oRm.writeClasses();              // there is no class to write, but this enables
		                                         // support for ColorBoxContainer.addStyleClass(...)
				oRm.addStyle("display", "flex");                                         
				oRm.writeStyles();
		        oRm.write(">");
	
				if (oControl.getTitle() && oControl.getTitle() !== "") {
			        // write title as a ui5 title element
					// Originally generated HMTL:
					// <div id="__title0" data-sap-ui="__title0" role="heading" class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth"><span id="__title0-inner">Deleted Users</span></div>
					//     <span id="__title0-inner">Deleted Users</span>
			        var oTitle = new sap.m.Title({ text : oControl.getTitle() });
			        oControl.addContent(oTitle);
				} else if (oControl.getLabel() && oControl.getLabel() !== "") {
					var oLabel = new sap.m.Label({ text : oControl.getLabel() });
			        oControl.addContent(oLabel);
				} 
				
		        var aChildren = oControl.getContent();
		        // debugger;
		        for (var i = 0; i < aChildren.length; i++) { // loop over all child Controls,
		            // render the colored box around them
		            oRm.write("<div "); // id='" + oControl.getId() + "-sub-" + i + "'");
		            oRm.addStyle("flex", "1"); // causes an align right as this cell uses all empty space
		            oRm.addStyle("padding-right", "1em");
		            // oRm.addStyle("border", "1px solid black"); // specify the border around the child - for development only
		            oRm.writeStyles();
		            oRm.write(">");
		            // debugger;
		            oRm.renderControl(aChildren[i]);   // render the child Control
		                                               // (could even be a big Control tree, but you don't need to care)
		            oRm.write("</div>"); // end of the box around the respective child
			    } 
			    
		        // write TAG with content (and closing tag)
		        if (oControl.getTag() && oControl.getTag() !== "") {
			        oRm.write("<div class='elxTxt sapMOnePersonNowMarker' "); 
		            oRm.addStyle("flex", "none");
			        oRm.writeStyles();
					oRm.write(">");
					oRm.writeEscaped("<");
					oRm.writeEscaped(oControl.getTag());
					oRm.writeEscaped(">");
					oRm.write("</div>");
		
					oRm.write("<div class='elxTxt' ");
		            oRm.addStyle("flex", "none");
			        oRm.writeStyles();
					oRm.write(">");
					oRm.writeEscaped("" + oControl.getText());
					oRm.write("</div>");
					
			        oRm.write("<div class='elxTxt sapMOnePersonNowMarker'");
		            oRm.addStyle("flex", "none");
			        oRm.writeStyles();
					oRm.write(">");
					// oRm.write("&lt;/" + oControl.getTag() + "&gt;");
					oRm.write("&lt;/&gt;");
					oRm.write("</div>");
		        } else {
		        	oRm.write("<div class='elxTxt' ");
		            oRm.addStyle("flex", "none");
			        oRm.writeStyles();
					oRm.write(">");
					oRm.writeEscaped("[" + oControl.getText() + "]");
					oRm.write("</div>");
		        }
	
				// close root div
		        oRm.write("</div>"); // end of the complete Control
		    } // end render
	    }, // end renderer
	    
	    /* onAfterRendering: function() {
	    	// if you need to do any post render actions, it will happen here
            if(sap.ui.core.Control.prototype.onAfterRendering) {
                 sap.ui.core.Control.prototype.onAfterRendering.apply(this,arguments); //run the super class's method first
            }
	    } */
	});
	
	return ResultLine;
});