sap.ui.define([
	"./BaseController",
	"sap/ui/model/resource/ResourceModel"

], function (BaseController, ResourceModel) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Intro", {
		onInit: function () {
			// set i18n model on view
			var i18nModel = new ResourceModel({
				bundleName: "glacelx.glacelx.i18n.i18n"
			});
			this.getView().setModel(i18nModel, "i18n");
		},

		onUseExampleFile: function () {
			// load sample XML file and process it
			var _oModel = this.getOwnerComponent().getModel("userXML");			
			this._processXML(_oModel.getData());

			// loading and processing of sample XML file is already done in onInit
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");
		},

		handleSelectXMLFile: function (oEvent) {				
			// select file 
			if (oEvent.getParameter("files") && oEvent.getParameter("files")[0]) {
				this._oFile = oEvent.getParameter("files")[0];					
			}

			// upload file (previously handleParseXMLFile: function (oEvent) {
			var that = this;
			if (this._oFile && window.FileReader) {
				var oFileReader = new FileReader();
				var _oModel = this.getOwnerComponent().getModel("userXML");
				oFileReader.onload = function (loadEvent) {					
					var sRawXML = loadEvent.target.result;					
					_oModel.setXML(sRawXML);
					that._processXML(_oModel.getData());
				};				
				oFileReader.readAsText(this._oFile);
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("elements");
			}			
		},

		_processXML: function (head) {
			this._processXMLElement(head, 0, -2);
		},

		_processXMLElement: function (head, lastPos, lastDepth) {			
			// leaf node
			if (head.children && head.children.length === 0) {
				head._tagLineStart = lastPos + 1;
				head._tagLineEnd = head._tagLineStart;
				head._tagClass = "leaf";
				head._tagDepth = lastDepth + 1; // we do not want to return this change				
				if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				}
				return {
					lPos: head._tagLineStart,
					lDepth: lastDepth
				};
			}
			// parent node
			else if (head.children && head.children.length > 0) {
				// MISSING: _tagLineEnd
				head._tagLineStart = lastPos + 1;
				head._tagDepth = lastDepth + 1;
				head._tagClass = "parent";
				// identify Measurement block
				if (head.tagName === "Measurement" && head.parentNode.parentNode === null) {
					head._tagMetaBlockAssociationName = "Measurement";
					head._tagMetaBlockAssociationHook = head;

					// set hooks to components if available
					for (var k = 0; k < head.children.length; ++k) {
						switch (head.children[k].tagName) {
						case "Header":
							head._tagMeasurementHeaderHook = head.children[k];
							break;
						case "Systems":
							head._tagMeasurementSystemsHook = head.children[k];
							break;
						case "Parts":
							head._tagMeasurementPartsHook = head.children[k];
							break;
						case "Results":
							head._tagMeasurementResultsHook = head.children[k];
							break;
						}
					}
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else {
					head._tagMetaBlockAssociationName = "invalid";
				}

				// initial values
				var _oCallValues = {};
				_oCallValues.lPos = head._tagLineStart;
				_oCallValues.lDepth = head._tagDepth;

				// call all children
				for (var i = 0; i < head.children.length; ++i) {
					_oCallValues = this._processXMLElement(head.children[i], _oCallValues.lPos, _oCallValues.lDepth);
				}

				// increase line position and ajdust its value in _oCallValues
				_oCallValues.lPos++;
				_oCallValues.lDepth = lastDepth;

				return _oCallValues;
			}
		}
	});
});