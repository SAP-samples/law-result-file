sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	".././layout/EqualWidthColumns",
	".././layout/ResultLine",
	"sap/m/Label"
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator, EqualWidthColumns, ResultLine, Label) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.part.Results", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			route.attachMatched(this._onRouteMatched, this);
			this.oView = this.getView();
			this._checkInitialModel();
			this.oModel = this.getOwnerComponent().getModel("userXML");
			var tabs = this.getView().byId("iconTabBar");
		},

		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},

		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");

			// This variable must have the name 'path' as it is checked in ManagedObject-dbg.js!! 
			// model name will be checked, everything before '>''
			// var path = "lawFile>/Systems(" + parseInt(oArgs.index) + ")";

			// create binding for System Details
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;

			// bind part properties
			var sPath = "/Results/Part/" + partIdx;
			var oForm = this.oView.byId("selectedResult");
			oForm.bindElement({
				path: sPath,
				model: "lawFile",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						this.oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						this.oView.setBusy(false);
					}
				}
			});
			// oForm = this.oView.byId("resultTable");

			// navigate to part branch and extract data
			var _mainModelRaw = this.oModel.getData().children[0];
			var _part = _mainModelRaw._tagMeasurementResultsHook.children[partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("resultsCE");
			// build editor context
			this.buildEditorContext(_part, _oSysCodeEditor);
			
			var _resultListArea = this.oView.byId("resultList");
			// $.sap.require(".././layout/ResultLine");
			
			for (var i = 0; i < _part.children.length; ++i) {
				var nextResult = _part.children[i];
				if (nextResult && nextResult.children && nextResult.children.length > 0) {
					// debugger;
					var tagsCount = nextResult.children.length;
					for (var j = 0; j < tagsCount; ++j) {
						var nextTag = nextResult.children[j];
						var rl = new ResultLine ({
								title: nextTag.tagName,
								tag: nextTag.tagName,
								text: nextTag.textContent });
					}
				} else { // else --> simple tag
					if (nextResult) {
						var rl = new ResultLine ({
								title: nextResult.tagName,
								tag: nextResult.tagName,
								text: nextResult.textContent });

						_resultListArea.addContent(rl);
					}
				}
			}
		},
		
		/* _getNonEmptyResultColumns: function (iPartIndex) {
			var results = this.oModel.getData().children[0]._tagMeasurementResultsHook.children;
			var corRes = results[iPartIndex];
			
			// loop over children
			for (var i = 0; i < corRes.children.length; ++i) {
				var nextNode = corRes.children[i];
				var nodeName = nextNode.nodeName;
				if (nodeName) {
					if (nodeName.trim().toLowerCase() === "result") {
						console.log(nextNode.children);
					}
					// ignore tags different from 'Result', particularly the 'PartId' tag
				}
			}
			// if no system was found return -1
			return -1;
		}, */		

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedResult").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}
	});
});