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
			var dataModel = this.getOwnerComponent().getModel("lawFile");
			this.getView().setModel(dataModel, "lawFile");

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");
		},

		handleSelectXMLFile: function (oEvent) {
			if (oEvent.getParameter("files") && oEvent.getParameter("files")[0]) {
				this._oFile = oEvent.getParameter("files")[0];
			} else {
				// this._oView.byId("btn_ParseXMLFile").setEnabled(!this.bTrue);
			}
		},

		handleParseXMLFile: function (oEvent) {
			// fix; timing issue when reloading model

			var that = this;
			if (this._oFile && window.FileReader) {
				var oFileReader = new FileReader();
				var _oModel = this.getOwnerComponent().getModel("userXML");

				oFileReader.onload = function (oEvent) {
					var sRawXML = oEvent.target.result;

					_oModel.setXML(sRawXML);
					that._processXML(_oModel.getData());
				};

				oFileReader.readAsText(this._oFile);
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("elements");

			}
			// this._oView.byId("toolPage").setBusy(!this.bTrue);
		},

		_processXML: function (head) {
			// startup process:
			// spawn initial "quick" model
			// run mapping calculations in web worker
			// once the mapped model is done make it available and enable search/navigation

			this.iOldTime = new Date().getTime();
			this._processXMLElement(head, 0, -2);
			this.getTimer();
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
				} else {}

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
			} else {}

		},

		getTimer: function () {
			this.new_Time = new Date().getTime();
			var seconds_passed = this.new_Time - this.iOldTime;
		}

	});
});