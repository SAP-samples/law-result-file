sap.ui.define([
	"sap/ui/core/mvc/Controller",
		"./BaseController"
], function (Controller, BaseController) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.Resultid", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.zglacelx.view.partid
		 */
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = this.oRouter.getRoute("resultid");			
			route.attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {	
			// load sample XML file and process it
			var _oModel = this.getOwnerComponent().getModel("userXML");			
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			_oModel.setXML(oStorage.get("xmlLocalStorage"));
			this._processXML(_oModel.getData());

			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			this.resultId = oArgs.resultId;
			
			this.partIdx = -1; // set default value for 'not found'
			this.sysIdx = -1; // set default value for 'not found
			
			// get the part index corresponding to the ResultId (= Part Id)
			var oParts = _oModel.getObject("/Parts");	
			var curPart, curPartChild, partIdx, sysNo, sysIdx;					
			
			if (oParts &&  oParts.childElementCount > 0) {
				oParts = oParts.children;
				// Loop over the Parts node and find the given partId=resultId in the tag <PartId>; then read the corresponding SystemNo 
				for (var i = 0; i < oParts.length; i++) {
					curPart = oParts[i];
					// partIdx and sysNo are used as flags if a matching PartId is found.
					partIdx = -1;
					sysNo = null;					
					if (curPart && curPart.childElementCount > 0) {
						// Loop over the tags of this <Part> node and read the <PartId> and the <SystemNo> values
						for (var j = 0; j < curPart.childElementCount; j++) {
							curPartChild = curPart.children[j];

							if (curPartChild && curPartChild.tagName.toUpperCase() === "PARTID" && curPartChild.innerHTML) {
									// found <PartId> tag
									if (curPartChild.innerHTML.trim() === this.resultId) {
										partIdx = i;
										if (sysNo) { 
											// SystemNo has been read before, so we have both values
											break;
										}
									} else {
										// console.log("Part ID " + curPartChild.innerHTML.trim() + " != " + this.resultId);
										// different PartId, no need to read SystemNo attribute
										break;
									}
							} else if (curPartChild && curPartChild.tagName.toUpperCase() === "SYSTEMNO") {
								sysNo = curPartChild.innerHTML.trim();
								if (partIdx > -1) {
									break;
								}
							} // else: any other tag different from <PartId> and <SystemNo>; ignore it
						}
						
						// If the PartId of this <Part> node matches with the one we search for, the partIdx variable will no 
						// longer be null and will hold the index of the matching part
						if (partIdx > -1 && sysNo) {							
							// YES --> search for SystemNo in the <Systems> block to get the index of the system
							var oSystems = _oModel.getObject("/Systems");	
							var curSyst, curSystChild;
							sysIdx = null; // used as flag for abort
							if (oSystems && oSystems.childElementCount > 0) {
								oSystems = oSystems.children;
								for (var si = 0; si < oSystems.length; si++) {
									curSyst = oSystems[si];
									if (curSyst && curSyst.childElementCount > 0) {
										for (var sj = 0; sj < curSyst.childElementCount; sj++) {
											curSystChild = curSyst.children[sj];
											if (curSystChild && curSystChild.tagName.toUpperCase() == "SYSTEMNO") {
												// console.log ("SystemNo " + curSystChild.innerHTML.trim() + " ?= " + sysNo);
												if (curSystChild && curSystChild.innerHTML.trim() === sysNo) {
													// console.log(" ------------ found ! -----------");
													sysIdx = si;													
													break;
												} else {
													break; // this System has a different SystemNo, try next one
												}
											}
										}
										if (sysIdx) {
											this.sysIdx = si;
											this.partIdx = partIdx;											
											break;
										}
									}
								}								
							}
							if (this.sysIdx == -1) {
								var msg = this.getView().getModel("i18n").getResourceBundle().getText("resultid.exception.NoSuchSystemNo.text"); // =No system found with SystemNo {0}.
								msg = jQuery.sap.formatMessage(msg, this.resultId);
								sap.m.MessageToast.show(msg);
							}


						} // else // this Part has a different ID -> go on with for loop and try the next one 						

						if (this.sysIdx > -1) {							
							break;
						}
					} // part has no child nodes (strange), so no <PartId> nor <SystemNo> tags to check; go on with next
				}

				if (this.partIdx == -1) {
					var msg = this.getView().getModel("i18n").getResourceBundle().getText("resultid.exception.NoSuchPartId.text"); //=No result part with ID {0} found.
					msg = jQuery.sap.formatMessage(msg, this.resultId);
					sap.m.MessageToast.show(msg);
				}
			}
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.support.zglacelx.view.partid
		 */
		onBeforeRendering: function() {
			if (this.partIdx && this.partIdx > -1 && this.sysIdx && this.sysIdx > -1) {
				this.oRouter.navTo("part", {
					partIndex: this.partIdx,
					sysIndex: this.sysIdx
				});
			} else {
				var _i18nBundle = this.getView().getModel("i18n").getResourceBundle();
				var oView = this.getView();
				
				var resLabel = oView.byId("result_id");
				var text = jQuery.sap.formatMessage(_i18nBundle.getText("resultid.label.result_id.text"), this.resultId);
				resLabel.setText(text);
				
				var sysLabel = oView.byId("system_id"); 
				text = jQuery.sap.formatMessage(_i18nBundle.getText("resultid.label.system_id.text"), this.sysIdx);
				sysLabel.setText(text);
				
				var partLabel = oView.byId("part_id");
				text = jQuery.sap.formatMessage(_i18nBundle.getText("resultid.label.part_id.text"), this.sysIdx);
				partLabel.setText(text);
			}

		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.support.zglacelx.view.partid
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.support.zglacelx.view.partid
		 */
		//	onExit: function() {
		//
		//	}

	});

});