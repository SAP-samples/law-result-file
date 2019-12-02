sap.ui.define("controller/layout/ResultLine", [
	"sap/ui/core/Control"
	
], function(Control) {
	"use strict";
	
	// if _isDebugMode is true, additional HTML comments are written to facilitate the analysis of the generated HMTL code
	var _isDebugMode = true;
	// var _renderStyle = 0;	// space in the middle: render left column with left alignment and right column with right alignment
	var _renderStyle = 1;	// space at the edges: render left column with right alignment and right column with left alignment
	
	/* This Control will render a headline and the corresponding tags */
	
	var ResultLine = Control.extend("controller/layout/ResultLine", {
		
	    metadata : {
	    	properties: { 
	    		title			: { type: "string" }, // The title of the check, engine, or user; if set, there will be a 1em space to the upper element
	    		label			: { type: "string" }, // Alternative to title - a simple lable instead of a title, no space to previous element, no bold etc.
	    		tag				: { type: "string" }, // The XML tag (without < and >) in the LAW file, e.g. GenericId for <GenericId>
	    		text			: { type: "string" }, // The XML text in the LAW file, e.g. CHKP000000DELU
	    		skipTopMargin	: { type: "boolean" }, // optional - skip the padding-top: 1em at the beginning
	    		firstTag		: { type: "string" }, // Alternative to title - a tag in the first column will be rendered in addition to the tag in the second column
	    		styleSuffix		: { type: "string" } // will be used as a style class in rendering step 1.3 (if provided), otherwise 'elxSrlSpanL' will be used
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
	    	// instead of "this" in the renderer function
	    	render: function(oArea, oResLine) { // static function, so use the given "oResLine" instance
	    		// console.log("  render t=" + oResLine.getTitle() + " \t l=" + oResLine.getLabel() + ", \ttag=" + oResLine.getTag() + ", \ttext=" + oResLine.getText() + ", \tskipLine=" + oResLine.getSkipTopMargin());
	    		oResLine.destroyContent(); // if removed, switching to the 'Properties' tab and back will add a furher title/lable "Deleted Users" each time
	    	
	    		if (_renderStyle === 1)	{
	    			this._renderEdgeSpaceStyle(oArea, oResLine);
	    		} else {
	    			// --- no longer in use !
	    			this._renderMiddleSpaceStyle(oArea, oResLine);
	    		}
	    	},
	    	
	    	/* writes this HTML:
	    	1.1		<div class="elxSrlDivL" style="padding-top: 0em;">
	    	1.2			<span class="elxSrlSpanL">
	    	1.3				<span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
	    						<bdi>Stammsaetze PD Organisationsmanagement</bdi>
	    					</span>
	    	1.4			</span>
	    			</div>
	    	1.5		<div class="elxSrlDivR" style="padding-top: 0em;">
	    	1.6			<span class="elxSrlSpanR" >
	    	2.1				<div class="elxRlCol2" style="flex: none; display: flex; padding: 0em;">
	    	2.2.				<div class="elxRlTxt sapMStdTileInfoError" style="flex: none;">
	    							&lt;Unit&gt;
	    						</div>
	    	2.3					<div class="elxRlTxt" style="flex: none;">
	    							UNT0000100
	    						</div>
	    	2.4					<div class="elxRlTxt sapMStdTileInfoError" style="flex: .5; text-align: left;">
	    							&lt;/&gt;
	    						</div>
	    	2.6				</div>
	    	1.7			</span>
	    			</div>
	    	
	    	*/
	    	_renderEdgeSpaceStyle: function (oArea, oResLine) {
	    		var styleSuffix = "";
	    		if (oResLine.getStyleSuffix()) {
	    			styleSuffix = oResLine.getStyleSuffix();
	    		}
	    		
			// -------------- left column part ('labels') --------------------------------------------------------
			
			// HMTL line 1
				if (_isDebugMode) { oArea.write("<!-- (1.1) -->"); }
				oArea.write("<div class='elxSrlDivL' ");
				if (!oResLine.getSkipTopMargin() || oResLine.getSkipTopMargin() == false) {
	        		oArea.addStyle("padding-top", "1em");
	        	} else {
	        		oArea.addStyle("padding-top", "0em");
	        	}
	        	oArea.writeControlData(oResLine);  // writes the Control ID and enables event handling - important!
				oArea.writeStyles();
		        oArea.write(">");
		        
			 // HMTL line 2
				if (_isDebugMode) { oArea.write("<!-- (1.2) -->"); }
				
				oArea.write("<span class='elxSrlSpanL" + styleSuffix + "' ");
	        	oArea.writeControlData(oResLine);  // writes the Control ID and enables event handling - important!
				oArea.writeStyles();
		        oArea.write(">");			
		        
		     // HMTL line 3
		    	if (_isDebugMode) { oArea.write("<!-- (1.3) -->"); }
				if (oResLine.getTitle() && oResLine.getTitle() !== "") {
			        // write title as a ui5 title element
					// Originally generated HMTL:
					// <div id="__title0" data-sap-ui="__title0" role="heading" class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth"><span id="__title0-inner">Deleted Users</span></div>
					//     <span id="__title0-inner">Deleted Users</span>
					
					
					/* title = new ClearLine({ style: "elxCL1" }); 
					title.addStyleClass("sapUiTinyMarginTop");
					displayedElements.push(title);			*/

					var oTitle = new sap.m.Label ({ text : oResLine.getTitle(), design: sap.m.LabelDesign.Bold }); 
			        // var oTitle = new sap.m.Title({ text : oResLine.getTitle() });
			        oArea.renderControl(oTitle);
			        //oResLine.addContent(oTitle);
				} else if (oResLine.getLabel() && oResLine.getLabel() !== "") {
					var oLabel = new sap.m.Label({ text : oResLine.getLabel() });
					oArea.renderControl(oLabel);
			        // oResLine.addContent(oLabel);
				} else {
					// empty cell
					if (_isDebugMode) { oArea.write("<div>.</div><!-- 1.3 has no title/label -->"); }
				}
			
			// HMTL line 4
				if (_isDebugMode) { oArea.write("<!-- (1.4) -->"); }
				oArea.write("</span></div>");		

			// -------------- right column part ('tabs/values') --------------------------------------------------------
			// HMTL line 5
				if (_isDebugMode) { oArea.write("<!-- (1.5) -->"); }
				oArea.write("<div class='elxSrlDivR' ");
				if (!oResLine.getSkipTopMargin() || oResLine.getSkipTopMargin() == false) {
	        		oArea.addStyle("padding-top", "1em");
	        	} else {
	        		oArea.addStyle("padding-top", "0em");
	        	}				
	        	oArea.writeControlData(oResLine);  // writes the Control ID and enables event handling - important!
				oArea.writeStyles();
		        oArea.write(">");
		        
		    // HMTL line 6
				if (_isDebugMode) { oArea.write("<!-- (1.6) -->"); }
				oArea.write("<span class='elxSrlSpanR" + styleSuffix + "' ");	
	        	oArea.writeControlData(oResLine);  // writes the Control ID and enables event handling - important!
				oArea.writeStyles();
		        oArea.write(">");			
		        
			// HMTL line 7		
				this.writeTag("elxRlCol2", oResLine.getTag(), oResLine.getText(), oArea) ;

			// HMTL line 8
				if (_isDebugMode) { oArea.write("<!-- (1.7) -->"); }
				oArea.write("</span></div>");	
	    	},
	    	
	    	
	    	/* writes this HTML:
	    	 1		<div class='elxRlTitle/elxLabel'> 
	    	 2			<Title /> or <Label />	or empty (if firstTag)
	    	 3			<div class='elxRlCol1'> 	--> width 50%
	    	 4				[all children HTML tags if applicable] 
	    						or or firstTag (same as tags lines 6 - 10)	--> with corresponding text
	    	 5			</div>
	    	 6			<div class='elxRlCol2'> 	--> width 50%
	    	 7				<div><TagName></div>		--> XML tag name
	    	 8				<div><TagValue></div>		--> XML tag value
	    	 9				<div></></div>				--> XML closing tag 
	    	10			</div>
	    	11		</div>
	    	-------------------------------------------------------- */
	    	_renderMiddleSpaceStyle: function (oArea, oResLine) {
		    	oResLine.destroyContent(); // if removed, switching to the 'Properties' tab and back will add a furher title/lable "Deleted Users" each time

				if (_isDebugMode) { oArea.write("<!-- (1.1) -->"); }
			// HMTL line 1				
		        if (oResLine.getTitle() && oResLine.getTitle() !== "") {
		        	oArea.write("<div class='elxRlTitle' ");
		        	if (!oResLine.getSkipTopMargin() || oResLine.getSkipTopMargin() == false) {
		        		oArea.addStyle("padding-top", "1em");
		        	} else {
		        		oArea.addStyle("padding-top", "0em");
		        	}
		        } else {
		        	oArea.write("<div class='elxRlLabel' ");
		        	if (!oResLine.getSkipTopMargin() || oResLine.getSkipTopMargin() == false) {
		        		oArea.addStyle("padding-top", "1em");
		        	} else {
		        		oArea.addStyle("padding-top", "0em");
		        	}
		        }
		        oArea.writeControlData(oResLine);  // writes the Control ID and enables event handling - important!
				oArea.addStyle("display", "flex");        
				// oArea.addStyle("flex", "1"); // flex: 1 causes an align right as this cell uses all empty space
				oArea.writeStyles();
		        oArea.write(">");
	
			// debugger;
				if (_isDebugMode) { oArea.write("<!-- (1.2) -->"); }
			// HMTL line 2				
				if (oResLine.getTitle() && oResLine.getTitle() !== "") {
			        // write title as a ui5 title element
					// Originally generated HMTL:
					// <div id="__title0" data-sap-ui="__title0" role="heading" class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth"><span id="__title0-inner">Deleted Users</span></div>
					//     <span id="__title0-inner">Deleted Users</span>
			        var oTitle = new sap.m.Title({ text : oResLine.getTitle() });
			        oArea.renderControl(oTitle);
			        //oResLine.addContent(oTitle);
				} else if (oResLine.getLabel() && oResLine.getLabel() !== "") {
					var oLabel = new sap.m.Label({ text : oResLine.getLabel() });
					oArea.renderControl(oLabel);
			        // oResLine.addContent(oLabel);
				} else {
					// empty cell
					if (_isDebugMode) { oArea.write("<!-- 1.2 has no title/label -->"); }
				}
				
				if (oResLine.getFirstTag() && oResLine.getFirstTag() !== "") {
		        	this.writeTag("elxRlCol1", oResLine.getFirstTag(), oResLine.getText(), oArea) ;
				} else {	
					if (_isDebugMode) { oArea.write("<!-- (1.3) -->");	}
			// HMTL line 3					
					oArea.write("<div class='elxRlCol1' ");
					oArea.addStyle("flex", "1"); // flex: 1 causes an align right as this cell uses all empty space
					oArea.writeStyles();
					oArea.write(">"); 
				
					if (_isDebugMode) { oArea.write("<!-- (1.4) -->"); }
			// HMTL line 4					
			        var aChildren = oResLine.getContent();
			        // debugger;
			        for (var i = 0; i < aChildren.length; i++) { // loop over all child Controls,
			        
			        	if (_isDebugMode) { oArea.write("<!-- (1.4 > Start Child " + i + ") -->"); }
					// HMTL line 4 > Child Start
			            // render the colored box around them
			            oArea.write("<div "); // id='" + oResLine.getId() + "-sub-" + i + "'");
			            oArea.addStyle("flex", "1"); // flex: 1 causes an align right as this cell uses all empty space
			            oArea.addStyle("padding-right", "1em");
	
			            		// oArea.addStyle("background-color", "#2196F3");
			            
			            // oArea.addStyle("border", "1px solid black"); // specify the border around the child - for development only
			            oArea.writeStyles();
			            oArea.write(">");
			            // debugger;
			            oArea.renderControl(aChildren[i]);   // render the child Control
			                                               // (could even be a big Control tree, but you don't need to care)
						if (_isDebugMode) { oArea.write("<!-- (1.4 > End Child " + i + ") -->"); }
					// HMTL line 4 > Child Start			                                               
			            oArea.write("</div>"); // end of the box around the respective child
				    } 
			    
				
					if (_isDebugMode) { oArea.write("<!-- (1.5) -->"); }
				// HTML line 5
					oArea.write("</div>"); // end of the box around the respective child
				}

				// debugger;
				this.writeTag("elxRlCol2", oResLine.getTag(), oResLine.getText(), oArea) ;
				
				if (_isDebugMode) { oArea.write("<!-- (1.6) -->"); }
			// HTML line 11 				
		    	oArea.write("</div>");
		    }, 

			writeTag: function (oDivClass, oTag, oText, oArea) {
				if (_isDebugMode) { oArea.write("<!-- (2.1) -->"); }
			// HMTL line 6
				oArea.write("<div class='" + oDivClass + "' ");
	
	        	//  oArea.write("<div ");
	            oArea.addStyle("flex", "none");
	            oArea.addStyle("display", "flex");
	            // oArea.addStyle("padding", "0em");
	            // oArea.addStyle("background-color", "#2196F3");
				oArea.writeStyles();
				oArea.write(">"); 
					
				// write TAG with content (and closing tag)
		        if (oTag && oTag !== "") {
					if (_isDebugMode) { oArea.write("<!-- (2.2) -->"); }
			// HTML line 7					
			        oArea.write("<div class='elxRlTxt sapMStdTileInfoError'"); 
		            oArea.addStyle("flex", "none");
			        oArea.writeStyles();
					oArea.write(">");
					oArea.writeEscaped("<");
					oArea.writeEscaped(oTag);
					oArea.writeEscaped(">");
					oArea.write("</div>");
	
					if (_isDebugMode) { oArea.write("<!-- (2.3) -->"); }
			// HTML line 8					
					oArea.write("<div class='elxRlTxt' ");
		            oArea.addStyle("flex", "none");
			        oArea.writeStyles();
					oArea.write(">");
					oArea.writeEscaped("" + oText);
					oArea.write("</div>");
	
					if (_isDebugMode) { oArea.write("<!-- (2.4) -->"); }
			// HTML line 9						
			        //oArea.write("<div class='elxRlTxt sapMOnePersonNowMarker'");
			        oArea.write("<div class='elxRlTxt sapMStdTileInfoError'");
		            oArea.addStyle("flex", ".5");
		            oArea.addStyle("text-align", "left");
			        oArea.writeStyles();
					oArea.write(">");
					// oArea.write("&lt;/" + oResLine.getTag() + "&gt;");
					oArea.write("&lt;/&gt;");
					oArea.write("</div>");
				} else {
					if (oText && oText !== "") {
						if (_isDebugMode) { oArea.write("<!-- (2.5) -->"); }
			// HTML line 8					
						oArea.write("<div class='elxRlTxt' ");
			            oArea.addStyle("flex", "none");
				        oArea.writeStyles();
						oArea.write(">");
						oArea.writeEscaped("" + oText);
						oArea.write("</div>");
					}
					
				}
				
				if (_isDebugMode) { oArea.write("<!-- (2.6) -->"); }
			// HTML line 10						
				oArea.write("</div>");
			} // end method write>Tag 
	    }

	}); // end renderer
	
	
	// MUST be a public variable: STYLE!
	// LC = left column, RC = right column, LA = left align, RA = right align
	ResultLine.STYLES = "HALLO"; // { "LC_Label_L3_LA": "elxSrlDivL", "LC_Label_L3_LA": "elxSrlDivB" };
	
	return ResultLine;
});